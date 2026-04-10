import { Injectable, InternalServerErrorException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly subscriptionService: SubscriptionService
    ) { }

    async create(createUserDto: CreateUserDto, companyId: string) {
        // Check Limits
        const usersCount = await this.countForCompany(companyId);
        const canCreate = await this.subscriptionService.checkLimits(companyId, 'max_users', usersCount);

        if (!canCreate) {
            throw new ForbiddenException('Osiągnięto limit użytkowników dla Twojego planu.');
        }

        const supabase = this.supabaseService.getAdminClient();

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: createUserDto.email,
            password: createUserDto.password,
            email_confirm: true, // Od razu potwierdzamy e-mail
        });

        if (authError) {
            if (authError.message.includes('unique constraint')) {
                throw new ConflictException('Użytkownik o tym adresie e-mail już istnieje.');
            }
            throw new InternalServerErrorException(authError.message);
        }

        // Krok 2: Stwórz profil użytkownika w naszej tabeli `users`
        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                company_id: companyId,
                first_name: createUserDto.firstName,
                last_name: createUserDto.lastName,
                role: createUserDto.role,
                email: createUserDto.email,
                is_active: true,
            })
            .select()
            .single();

        if (profileError) {
            await supabase.auth.admin.deleteUser(authData.user.id);
            throw new InternalServerErrorException(profileError.message);
        }

        return profileData;
    }

    async countForCompany(companyId: string): Promise<number> {
        const supabase = this.supabaseService.getClient();
        const { count, error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId);

        if (error) return 0;
        return count || 0;
    }

    private async setActiveStatus(userId: string, companyId: string, isActive: boolean) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('users')
            .update({ is_active: isActive })
            .eq('id', userId)
            .eq('company_id', companyId)
            .select('id')
            .single();

        if (error) throw new InternalServerErrorException(error.message);
        if (!data) throw new NotFoundException('Nie znaleziono użytkownika.');
        return { message: isActive ? 'Użytkownik aktywowany.' : 'Użytkownik dezaktywowany.' };
    }

    async activate(userId: string, companyId: string) {
        return this.setActiveStatus(userId, companyId, true);
    }

    async deactivate(userId: string, companyId: string) {
        return this.setActiveStatus(userId, companyId, false);
    }

    async findAllForCompany(companyId: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('company_id', companyId);

        if (error) {
            throw new InternalServerErrorException(error.message);
        }
        return data;
    }
}