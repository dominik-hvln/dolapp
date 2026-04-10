import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CompaniesService {
    constructor(private readonly supabaseService: SupabaseService) {}

    async getInviteCode(companyId: string) {
        const supabase = this.supabaseService.getClient();
        const { data, error } = await supabase
            .from('companies')
            .select('invite_code')
            .eq('id', companyId)
            .single();

        if (error) throw new InternalServerErrorException(error.message);
        return { inviteCode: data.invite_code };
    }
}
