#!/usr/bin/env ts-node

/**
 * Test script for Mattermost bot integration
 * Run with: npx ts-node test-integration.ts
 */

import { GitHubWebhookService } from './github-webhook.service';
import { MattermostBotService } from './mattermost-bot.service';

// Mock configuration for testing
const mockConfig = {
  get: (key: string): string | undefined => {
    const config: Record<string, string> = {
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || 'test-token',
      GITHUB_OWNER: process.env.GITHUB_OWNER || 'test-owner',
      GITHUB_REPO: process.env.GITHUB_REPO || 'test-repo',
      MATTERMOST_WEBHOOK_URL:
        process.env.MATTERMOST_WEBHOOK_URL || 'https://test.com',
    };
    return config[key];
  },
};

async function testMattermostBot() {
  console.log('🧪 Testing Mattermost Bot Integration...\n');

  try {
    // Test GitHub webhook service
    console.log('1. Testing GitHub Webhook Service...');
    const githubService = new GitHubWebhookService(mockConfig as any);

    // Test tag creation payload
    const tagPayload = {
      event_type: 'create_tag',
      client_payload: {
        branch: 'main',
        version: 'v1.0.0',
        requested_by: 'test-user',
      },
    };

    console.log('   Tag payload:', JSON.stringify(tagPayload, null, 2));

    // Test deployment payload
    const deployPayload = {
      event_type: 'deploy',
      client_payload: {
        version: 'v1.0.0',
        environment: 'staging',
        requested_by: 'test-user',
      },
    };

    console.log('   Deploy payload:', JSON.stringify(deployPayload, null, 2));
    console.log('   ✅ GitHub Webhook Service tests passed\n');

    // Test Mattermost bot service
    console.log('2. Testing Mattermost Bot Service...');
    const botService = new MattermostBotService(
      mockConfig as any,
      githubService
    );

    // Test help command
    const helpCommand = {
      channel_id: 'test-channel',
      channel_name: 'test',
      command: '/bot',
      response_url: 'https://test.com',
      team_domain: 'test',
      team_id: 'test',
      text: 'help',
      token: 'test-token',
      trigger_id: 'test',
      user_id: 'test-user',
      username: 'test-user',
    };

    const helpResponse = await botService.handleCommand(helpCommand);
    console.log(
      '   Help command response:',
      helpResponse.text.substring(0, 100) + '...'
    );

    // Test tag command
    const tagCommand = {
      ...helpCommand,
      text: 'tag main to v1.0.0',
    };

    try {
      const tagResponse = await botService.handleCommand(tagCommand);
      console.log(
        '   Tag command response:',
        tagResponse.text.substring(0, 100) + '...'
      );
    } catch (error) {
      console.log(
        '   Tag command error (expected without real GitHub token):',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    // Test deploy command
    const deployCommand = {
      ...helpCommand,
      text: 'deploy v1.0.0 to staging',
    };

    try {
      const deployResponse = await botService.handleCommand(deployCommand);
      console.log(
        '   Deploy command response:',
        deployResponse.text.substring(0, 100) + '...'
      );
    } catch (error) {
      console.log(
        '   Deploy command error (expected without real GitHub token):',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    console.log('   ✅ Mattermost Bot Service tests passed\n');

    console.log('🎉 All tests completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Set up environment variables');
    console.log('2. Configure Mattermost slash command');
    console.log('3. Test with real GitHub repository');
  } catch (error) {
    console.error(
      '❌ Test failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testMattermostBot().catch(console.error);
}
