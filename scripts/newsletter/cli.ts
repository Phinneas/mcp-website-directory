#!/usr/bin/env node

import { NewsletterScheduler } from './scheduler.js';
import { NewsletterGenerator } from './generator.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const scheduler = new NewsletterScheduler();
  const generator = new NewsletterGenerator();

  switch (command) {
    case 'weekly':
      console.log('Generating and publishing weekly newsletter...');
      await scheduler.runWeeklyNewsletter();
      break;

    case 'monthly':
      console.log('Generating and publishing monthly newsletter...');
      await scheduler.runMonthlyNewsletter();
      break;

    case 'test-weekly':
      console.log('Testing weekly newsletter generation (no publish)...');
      await scheduler.testWeekly();
      break;

    case 'test-monthly':
      console.log('Testing monthly newsletter generation (no publish)...');
      await scheduler.testMonthly();
      break;

    case 'schedule':
      console.log('Starting newsletter scheduler daemon...');
      scheduler.startScheduler();
      break;

    case 'preview-weekly':
      console.log('Generating weekly newsletter preview...');
      const weeklyNewsletter = await generator.generateWeeklyNewsletter();
      console.log('\n=== WEEKLY NEWSLETTER PREVIEW ===');
      console.log('Subject:', weeklyNewsletter.subject);
      console.log('Metadata:', weeklyNewsletter.metadata);
      console.log('\nHTML Content:');
      console.log(weeklyNewsletter.content.html);
      console.log('\nText Content:');
      console.log(weeklyNewsletter.content.text);
      break;

    case 'preview-monthly':
      console.log('Generating monthly newsletter preview...');
      const monthlyNewsletter = await generator.generateMonthlyNewsletter();
      console.log('\n=== MONTHLY NEWSLETTER PREVIEW ===');
      console.log('Subject:', monthlyNewsletter.subject);
      console.log('Metadata:', monthlyNewsletter.metadata);
      console.log('\nHTML Content:');
      console.log(monthlyNewsletter.content.html);
      console.log('\nText Content:');
      console.log(monthlyNewsletter.content.text);
      break;

    default:
      console.log(`
MCP Newsletter CLI

Usage:
  npm run newsletter <command>

Commands:
  weekly           Generate and publish weekly newsletter
  monthly          Generate and publish monthly newsletter
  test-weekly      Test weekly newsletter generation (no publish)
  test-monthly     Test monthly newsletter generation (no publish)
  preview-weekly   Generate and display weekly newsletter preview
  preview-monthly  Generate and display monthly newsletter preview
  schedule         Start newsletter scheduler daemon

Environment Variables:
  BEEHIIV_API_KEY         Your Beehiiv API key
  BEEHIIV_PUBLICATION_ID  Your Beehiiv publication ID
  TAVILY_API_KEY          Your Tavily API key (for server discovery)

Examples:
  npm run newsletter weekly
  npm run newsletter preview-monthly
  npm run newsletter schedule
      `);
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Newsletter CLI error:', error);
  process.exit(1);
});
