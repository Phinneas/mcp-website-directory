// Stub implementation for ConfigManager until tavily integration is complete
export class ConfigManager {
  getSystemConfig() {
    return {
      dataDir: './data',
      newServersDir: './data/new-servers',
      monthlyReportsDir: './data/monthly-reports',
      seenServersFile: './data/seen-servers.json',
      vendorWatchlistFile: './data/vendor-watchlist.json',
      logLevel: 'info' as const
    };
  }
}
