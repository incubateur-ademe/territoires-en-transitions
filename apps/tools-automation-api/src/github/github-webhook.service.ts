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

interface GitHubPullRequestReviewEvent extends GitHubPullRequestEvent {
  review: {
    state: string;
    body: string;
    user: {
      login: string;
    };
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

function getReviewerMattermostUsername(reviewer: string) {
  return REVIEWERS_GITHUB_TO_MATTERMOST_MAP[
    reviewer as keyof typeof REVIEWERS_GITHUB_TO_MATTERMOST_MAP
  ];
}

@Injectable()
export class GitHubWebhookService {
  private readonly logger = new Logger(GitHubWebhookService.name);

  constructor(
    private readonly mattermostService: MattermostNotificationService
  ) {}

  async handlePullRequestEvent(payload: GitHubPullRequestEvent) {
    const { pull_request, action } = payload;

    // Skip draft PRs
    if (pull_request.draft) {
      this.logger.log(`Skipping draft PR #${pull_request.number}`);
      return;
    }

    if (
      action === 'synchronize' ||
      action === 'edited' ||
      action === 'assigned'
    ) {
      this.logger.log(
        `Skipping synchronize event for PR #${pull_request.number}`
      );
      return;
    }

    const reviewers =
      action === 'review_requested'
        ? pull_request.requested_reviewers?.map(
            (reviewer) => `@${getReviewerMattermostUsername(reviewer.login)}`
          )
        : [];

    const message = this.wrapMessage(
      reviewers?.length > 0 ? `${reviewers.join(' ')}` : '',
      pull_request,
      action,
      `from ${pull_request.user.login}`
    );
    await this.mattermostService.postMessage(message);
  }

  async handlePullRequestReviewEvent(payload: GitHubPullRequestReviewEvent) {
    const { pull_request, review, action } = payload;

    const message = this.wrapMessage(
      `@${getReviewerMattermostUsername(pull_request.user.login)}`,
      pull_request,
      `review_${action}`,
      `from ${review.user.login}`
    );

    await this.mattermostService.postMessage(message);
  }

  private wrapMessage(
    message: string,
    pull_request: GitHubPullRequestEvent['pull_request'],
    action: string,
    from: string
  ): string {
    const emoji = this.getActionEmoji(action);

    return `#github
${emoji} **${action}** ${from}
${message}

[${pull_request.title} (#${pull_request.number})](${pull_request.html_url})`;
  }

  private getActionEmoji(action: string): string {
    const emojiMap: Record<string, string> = {
      opened: '🆕',
      closed: '🔒',
      reopened: '🔄',
      merged: '✅',
      review_requested: '👀',
      review_submitted: '👁️',
      ready_for_review: '📝',
    };
    return emojiMap[action] || '📌';
  }
}
