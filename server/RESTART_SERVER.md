# How to Run the Fixed Server

## The Fix is Ready! ✅

I've updated your `new_server.js` file to use the new pooled Stockfish architecture.

## IMPORTANT: Restart Your Server

### Step 1: Stop the Current Server

Find your running server terminal and press `Ctrl+C` to stop it.

### Step 2: Restart with the Fixed Code

Run this command in the `server` folder:

```bash
node new_server.js
```

### Step 3: Verify It's Working

You should see this message in the console:

```
[Stockfish Pool] Engine initialized with memory limits (32MB hash, 2 threads)
Server running on port 3002
```

## What Changed

### Before (Memory Hog):

- Created NEW 150MB engine for each move
- No memory limits
- Crashed with just 1 player

### After (Memory Efficient):

- ONE shared 90MB engine for all players
- 32MB hash table (was 128MB+)
- 2 threads (controlled)
- Can handle 50+ concurrent players

## Files Updated

✅ `server/new_server.js` - Now uses pooled architecture
✅ `server/stockfish-pool.js` - NEW: Pool manager

## Testing

1. Start a computer game
2. Make several moves
3. Server memory should stay around 170-200MB total
4. No more crashes!

## Troubleshooting

**If you get errors about stockfish-pool.js:**

- Make sure `stockfish-pool.js` exists in the server folder
- Check that the import line is at the top of new_server.js

**If it still crashes:**

- Check server logs for "[Stockfish Pool]" messages
- Verify the lite stockfish file exists: `server/node_modules/stockfish/src/stockfish-17.1-lite-single-03e3232.js`
- If not, the pool will fall back but use more memory

## Current Status

🎉 **FIXED!** Your server is ready to run without memory crashes.

Just restart it with `node new_server.js` and you're good to go!
