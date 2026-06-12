import { NewsletterGenerator } from './generator.js';
import { StorageManager } from '../tavily/storage.js';

interface ScheduleConfig {
  weeklyDay: number; // 0 = Sunday, 1 = Monday, etc.
  weeklyHour: number; // 0-23
  monthlyDay: number; // 1-31
  monthlyHour: number; // 0-23
  timezone: string;
}

export class NewsletterScheduler {
  private generator: NewsletterGenerator;
  private storage: StorageManager;
  private config: ScheduleConfig;

  constructor(config: Partial<ScheduleConfig> = {}) {
    this.generator = new NewsletterGenerator();
    this.storage = new StorageManager();
    this.config = {
      weeklyDay: 1, // Monday
      weeklyHour: 9, // 9 AM
      monthlyDay: 1, // 1st of month
      monthlyHour: 9, // 9 AM
      timezone: 'UTC',
      ...config
    };
  }

  async runWeeklyNewsletter(): Promise<void> {
    console.log('Running weekly newsletter generation...');
    
    try {
      const newsletter = await this.generator.generateWeeklyNewsletter();
      await this.generator.publishNewsletter(newsletter);
      
      // Log the successful run
      await this.logNewsletterRun('weekly', newsletter);
      
      console.log('Weekly newsletter completed successfully!');
    } catch (error) {
      console.error('Weekly newsletter failed:', error);
      throw error;
    }
  }

  async runMonthlyNewsletter(): Promise<void> {
    console.log('Running monthly newsletter generation...');
    
    try {
      const newsletter = await this.generator.generateMonthlyNewsletter();
      await this.generator.publishNewsletter(newsletter);
      
      // Log the successful run
      await this.logNewsletterRun('monthly', newsletter);
      
      console.log('Monthly newsletter completed successfully!');
    } catch (error) {
      console.error('Monthly newsletter failed:', error);
      throw error;
    }
  }

  async checkAndRun(): Promise<void> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();
    const hour = now.getHours();

    // Check if it's time for weekly newsletter
    if (dayOfWeek === this.config.weeklyDay && hour === this.config.weeklyHour) {
      const lastWeeklyRun = await this.getLastNewsletterRun('weekly');
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      if (!lastWeeklyRun || new Date(lastWeeklyRun) < oneWeekAgo) {
        await this.runWeeklyNewsletter();
      }
    }

    // Check if it's time for monthly newsletter
    if (dayOfMonth === this.config.monthlyDay && hour === this.config.monthlyHour) {
      const lastMonthlyRun = await this.getLastNewsletterRun('monthly');
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      if (!lastMonthlyRun || new Date(lastMonthlyRun) < oneMonthAgo) {
        await this.runMonthlyNewsletter();
      }
    }
  }

  private async logNewsletterRun(type: 'weekly' | 'monthly', newsletter: any): Promise<void> {
    try {
      // Store newsletter run log in storage system
      const logEntry = {
        type,
        date: new Date().toISOString(),
        subject: newsletter.subject,
        metadata: newsletter.metadata,
        success: true
      };

      // For now, just log to console - would integrate with storage system
      console.log('Newsletter run logged:', logEntry);
    } catch (error) {
      console.error('Failed to log newsletter run:', error);
    }
  }

  private async getLastNewsletterRun(type: 'weekly' | 'monthly'): Promise<string | null> {
    try {
      // Retrieve last newsletter run from storage system
      // Mock implementation - would integrate with storage system
      return null;
    } catch (error) {
      console.error('Failed to get last newsletter run:', error);
      return null;
    }
  }

  // Method to run scheduler continuously
  startScheduler(): void {
    console.log('Starting newsletter scheduler...');
    
    // Check every hour
    const interval = setInterval(async () => {
      try {
        await this.checkAndRun();
      } catch (error) {
        console.error('Scheduler error:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Also run initial check
    this.checkAndRun().catch(console.error);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('Stopping newsletter scheduler...');
      clearInterval(interval);
      process.exit(0);
    });
  }

  // Method for manual testing
  async testWeekly(): Promise<void> {
    console.log('Testing weekly newsletter generation...');
    const newsletter = await this.generator.generateWeeklyNewsletter();
    console.log('Generated newsletter:', {
      subject: newsletter.subject,
      metadata: newsletter.metadata,
      contentLength: newsletter.content.html.length
    });
  }

  async testMonthly(): Promise<void> {
    console.log('Testing monthly newsletter generation...');
    const newsletter = await this.generator.generateMonthlyNewsletter();
    console.log('Generated newsletter:', {
      subject: newsletter.subject,
      metadata: newsletter.metadata,
      contentLength: newsletter.content.html.length
    });
  }
}
