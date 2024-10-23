import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import PanierService from '../services/panier.service';
import { PanierClass } from '../models/panier.table';
import { CollectiviteRequestType } from '../../collectivites/models/collectivite.request';
import { ActionInPanierRequestClass } from '../models/action-in-panier.request';
import { ActionInPanierStatutRequestClass } from '../models/action-in-panier-statut.request';
import { PanierCompletClass } from '../models/get-panier-complet.response';
import { GetPanierCompletRequestClass } from '../models/get-panier-complet.request';
import { CreatePlanFromPanierRequestClass } from '../models/create-plan-from-panier.request';
import { TokenInfo } from '../../auth/decorators/token-info.decorators';
import { SupabaseJwtPayload } from '../../auth/models/supabase-jwt.models';
import PlanFromPanierService from '../services/plan-from-panier.service';

@ApiTags('Panier')
@Controller('panier')
export class PanierController {
  private readonly logger = new Logger(PanierController.name);

  constructor(
    private readonly panierService: PanierService,
    private readonly planFromPanierService: PlanFromPanierService
  ) {}

  @Get('')
  @ApiResponse({ type: PanierClass })
  async panierFromLanding(
    @Query() request: CollectiviteRequestType
  ): Promise<PanierClass | null> {
    if (request.collectivite_id) {
      this.logger.log(
        `Récupération du panier de la collectivité ${request.collectivite_id}.`
      );
    } else {
      this.logger.log(`Création d'un nouveau panier.`);
    }
    return this.panierService.getPanier(request.collectivite_id);
  }

  @Post('action_impact')
  async addActionToPanier(
    @Body() request: ActionInPanierRequestClass
  ): Promise<void> {
    this.logger.log(
      `Ajoute l'action ${request.actionImpactId} au panier ${request.panierId}`
    );
    await this.panierService.addActionImpact(
      request.actionImpactId,
      request.panierId
    );
  }

  @Delete('action_impact')
  async removeActionFromPanier(
    @Query() request: ActionInPanierRequestClass
  ): Promise<void> {
    this.logger.log(
      `Enlève l'action ${request.actionImpactId} au panier ${request.panierId}`
    );
    await this.panierService.removeActionImpact(
      request.actionImpactId,
      request.panierId
    );
  }

  @Put('action_impact/statut')
  async setActionStatut(
    @Body() request: ActionInPanierStatutRequestClass
  ): Promise<void> {
    this.logger.log(
      `Change le statut de l'action ${request.actionImpactId} dans le panier ${request.panierId} par ${request.categorieId}`
    );
    await this.panierService.setActionImpactCategorie(
      request.actionImpactId,
      request.panierId,
      request.categorieId || null
    );
  }

  @Get('contenu')
  @ApiResponse({ type: PanierCompletClass })
  async fetchPanier(
    @Query() request: GetPanierCompletRequestClass
  ): Promise<PanierCompletClass | null> {
    this.logger.log(`Récupération du contenu du panier ${request.panierId}.`);
    return this.panierService.getPanierComplet(
      request.panierId,
      request.thematiquesIds,
      request.niveauxBudget,
      request.niveauxTemps
    );
  }

  @Post('contenu')
  async createPlanFromPanier(
    @Body() request: CreatePlanFromPanierRequestClass,
    @TokenInfo() tokenInfo: SupabaseJwtPayload
  ): Promise<number | null> {
    if (request.planId) {
      this.logger.log(
        `Ajoute le contenu du panier ${request.panierId} au plan ${request.planId} pour la collectivité ${request.collectiviteId}`
      );
    } else {
      this.logger.log(
        `Cree un plan à partir du panier ${request.panierId} pour la collectivité ${request.collectiviteId}`
      );
    }
    return await this.planFromPanierService.addPlanFromPanier(
      tokenInfo,
      request.collectiviteId,
      request.panierId,
      request.planId
    );
  }

  @Put('directus')
  async majPanierFromDirectus(
    @TokenInfo() tokenInfo: SupabaseJwtPayload
  ): Promise<void> {
    this.logger.log(
      `Met à jour les contenus du panier dans l'app par rapport au contenu dans Directus.`
    );
    await this.panierService.majPanierFromDirectus(tokenInfo);
  }
}
