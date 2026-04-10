import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, Role } from '../auth/roles.decorator';

@Controller('companies')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CompaniesController {
    constructor(private readonly companiesService: CompaniesService) {}

    @Get('invite-code')
    @Roles(Role.Admin, Role.Manager)
    getInviteCode(@Req() req) {
        return this.companiesService.getInviteCode(req.user.company_id);
    }
}
