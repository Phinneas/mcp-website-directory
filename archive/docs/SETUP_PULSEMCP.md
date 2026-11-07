# PulseMCP API Integration Setup

Your MCP Directory now integrates with the PulseMCP API to fetch live data from 5,400+ servers!

## How it works

1. **API First**: Tries to fetch servers from PulseMCP API
2. **Fallback**: Uses static data if API is unavailable
3. **Automatic**: No manual server curation needed

## Setup Instructions

### Option 1: Use with running PulseMCP server (Recommended)

1. **Clone and start the PulseMCP server**:
```bash
# In a separate terminal window
git clone https://github.com/orliesaurus/pulsemcp-server.git
cd pulsemcp-server
npm install
npm start
```

2. **Start your MCP Directory**:
```bash
# In your mcp-directory folder
npm run dev
```

The directory will automatically fetch all servers from the API!

### Option 2: Use static data only

If you want to skip the API integration:

1. Create a `.env` file:
```bash
USE_STATIC_DATA=true
```

2. Start the dev server:
```bash
npm run dev
```

## What you'll see

- **With API**: All 5,400+ servers from PulseMCP automatically loaded
- **Without API**: Your curated ~80 servers as fallback

## Environment Variables

Create a `.env` file with:

```env
# PulseMCP API URL (default: http://localhost:3001)
PULSEMCP_API_URL=http://localhost:3001

# Force static data instead of API
USE_STATIC_DATA=false
```

## API Integration Features

- ✅ Automatic pagination through all servers
- ✅ Graceful fallback to static data
- ✅ Error handling and timeout protection
- ✅ Category mapping from PulseMCP to your categories
- ✅ Real-time server count and statistics
- ✅ All original features (search, filter, copy buttons)

## Troubleshooting

If you see static data (80 servers), check:
1. Is pulsemcp-server running on port 3001?
2. Check browser console for API errors
3. Verify `.env` settings

The integration is designed to work seamlessly - if the API is down, you still get a working directory with static data!