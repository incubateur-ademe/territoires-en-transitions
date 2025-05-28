import { Injectable, Logger } from '@nestjs/common';
import MattermostNotificationService from '../utils/mattermost-notification.service';

interface GitHubPullRequestEvent {
  action: string;
  pull_request: {
    html_url: string;
    title: string;
    user: {
      login: string;
    };
    number: number;
    state: string;
    draft: boolean;
    requested_reviewers: {
      login: string;
    }[];
  };
  repository: {
    name: string;
    full_name: string;
  };
}

const REVIEWERS_GITHUB_TO_MATTERMOST_MAP = {
  cparthur: 'arthur.molinos',
  dimitrivalax: 'dimitri.valax',
  dthib: 'thibaut.dusanter',
  farnoux: 'fred.arnoux',
  GaelS: 'gael.servaud',
  'marc-rutkowski': 'marc.rutkowski',
  mariheck: 'marine.heckler',
  elisfainstein: 'eli.fainstein',
};

@Injectable()
export class GitHubWebhookService {
  private readonly logger = new Logger(GitHubWebhookService.name);

  constructor(
    private readonly mattermostService: MattermostNotificationService
  ) {}

  async handlePullRequestEvent(payload: GitHubPullRequestEvent) {
    const { pull_request } = payload;

    // Skip draft PRs
    if (pull_request.draft) {
      this.logger.log(`Skipping draft PR #${pull_request.number}`);
      return;
    }

    const message = this.formatPullRequestMessage(payload);
    await this.mattermostService.postMessage(message);
  }

  private formatPullRequestMessage(payload: GitHubPullRequestEvent): string {
    const { action, pull_request } = payload;
    const emoji = this.getActionEmoji(action);

    const reviewers =
      pull_request.requested_reviewers?.map(
        (reviewer) =>
          `@${
            REVIEWERS_GITHUB_TO_MATTERMOST_MAP[
              reviewer.login as keyof typeof REVIEWERS_GITHUB_TO_MATTERMOST_MAP
            ]
          }`
      ) || [];

    return `#github
${emoji} **${action}** ${
      reviewers.length > 0
        ? `
  ${reviewers.join(' ')}`
        : ''
    }

[${pull_request.title} (#${pull_request.number})](${pull_request.html_url})

By: @${pull_request.user.login}
State: ${pull_request.state}`;
  }

  private getActionEmoji(action: string): string {
    const emojiMap: Record<string, string> = {
      opened: '🆕',
      closed: '🔒',
      reopened: '🔄',
      merged: '✅',
      review_requested: '👀',
      ready_for_review: '📝',
    };
    return emojiMap[action] || '📌';
  }
}
