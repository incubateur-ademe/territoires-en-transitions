import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../models/auth.models';
import {
  UpdateUserPreferencesFlatInput,
  UpdateUserPreferencesInput,
  UserPreferencesRepository,
} from './user-preferences.repository';

@Injectable()
export class UserPreferencesService {
  constructor(
    private readonly userPreferencesRepository: UserPreferencesRepository
  ) {}

  getUserPreferences(userId: string) {
    return this.userPreferencesRepository.getUserPreferencesByUserId(userId);
  }

  updateUserPreferences(
    user: AuthenticatedUser,
    preferences: UpdateUserPreferencesInput
  ) {
    return this.userPreferencesRepository.updateUserPreferences(
      user.id,
      preferences
    );
  }

  updateUserPreferencesFlat(
    user: AuthenticatedUser,
    preferences: UpdateUserPreferencesFlatInput
  ) {
    return this.userPreferencesRepository.updateUserPreferencesFlat(
      user.id,
      preferences
    );
  }
}
