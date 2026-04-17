import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly subscriptionService: SubscriptionService
    ) { }

    async create(createProjectDto: CreateProjectDto, companyId: string) {
        // Check Limits
        const projectsCount = await this.countForCompany(companyId);
        const canCreate = await this.subscriptionService.checkLimits(companyId, 'max_projects', projectsCount);

        if (!canCreate) {
            throw new ForbiddenException('Osiągnięto limit projektów dla Twojego planu.');
        }

        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('projects')
            .insert({ ...createProjectDto, company_id: companyId })
            .select()
            .single();

        if (error) {
            throw new InternalServerErrorException(error.message);
        }
        return data;
    }

    async countForCompany(companyId: string): Promise<number> {
        const supabase = this.supabaseService.getClient();
        const { count, error } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId);

        if (error) return 0;
        return count || 0;
    }

    async findAllForCompany(companyId: string) {
        const supabase = this.supabaseService.getClient();

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('company_id', companyId);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }
        return data;
    }

    async findOne(id: string, companyId: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .eq('company_id', companyId)
            .single();
        if (error) throw new NotFoundException(`Project with ID ${id} not found.`);
        return data;
    }

    async update(id: string, companyId: string, updateProjectDto: UpdateProjectDto) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('projects')
            .update(updateProjectDto)
            .eq('id', id)
            .eq('company_id', companyId)
            .select()
            .single();
        if (error) throw new InternalServerErrorException(error.message);
        return data;
    }

    async remove(id: string, companyId: string) {
        await this.findOne(id, companyId);

        const supabase = this.supabaseService.getClient();

        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('id')
            .eq('project_id', id);
        if (tasksError) throw new InternalServerErrorException(tasksError.message);
        const taskIds = (tasks ?? []).map((t) => t.id);

        const throwIfError = (res: { error: { message: string } | null }) => {
            if (res.error) throw new InternalServerErrorException(res.error.message);
        };

        // time_entries: zachowujemy historię rozliczeń - zerujemy tylko referencje
        const cleanupOps = [
            supabase.from('qr_codes').delete().eq('project_id', id).then((r) => r),
            supabase.from('time_entries').update({ task_id: null, project_id: null }).eq('project_id', id).then((r) => r),
        ];
        if (taskIds.length > 0) {
            cleanupOps.push(
                supabase.from('task_assignments').delete().in('task_id', taskIds).then((r) => r),
                supabase.from('qr_codes').delete().in('task_id', taskIds).then((r) => r),
            );
        }
        (await Promise.all(cleanupOps)).forEach(throwIfError);

        throwIfError(await supabase.from('tasks').delete().eq('project_id', id));
        throwIfError(
            await supabase.from('projects').delete().eq('id', id).eq('company_id', companyId),
        );
    }

    async generateQrCode(projectId: string) {
        const supabase = this.supabaseService.getClient();
        const { data: existingCode, error: findError } = await supabase
            .from('qr_codes')
            .select('code_value')
            .eq('project_id', projectId)
            .single();

        if (existingCode) {
            return existingCode;
        }

        if (findError && findError.code !== 'PGRST116') {
            throw new InternalServerErrorException(findError.message);
        }

        const { data, error } = await supabase
            .from('qr_codes')
            .insert({ project_id: projectId })
            .select('code_value')
            .single();

        if (error) {
            throw new InternalServerErrorException(error.message);
        }
        return data;
    }
}