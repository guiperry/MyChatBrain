# NebulaDB Migration Guide

## Migration Summary

- **Source Database**: postgresql
- **Collections Migrated**: 41
- **Files Modified**: 50
- **Migration Date**: 2025-11-08T04:31:29-05:00

## Next Steps

### 1. Install Dependencies

Run the following command to install NebulaDB:

```bash
npm install
```

### 2. Verify Database Initialization

The database is automatically initialized in `src/db/nebuladb.ts`.

Data is stored in your platform-specific application data directory:
- **Windows**: %APPDATA%\nebuladb-data
- **macOS**: ~/Library/Application Support/nebuladb-data
- **Linux**: ~/.local/share/nebuladb-data

### 3. Review Modified Files

The following files were modified during migration:

- `.next/server/app/login/page.js`
- `.next/server/app/not-found.js`
- `.next/server/app/page.js`
- `.next/server/vendor-chunks/next.js`
- `.next/server/webpack-runtime.js`
- `scripts/check-db.js`
- `scripts/seed-db.js`
- `src/app/api/addMessages/route.ts`
- `src/app/api/auth/change-password/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/me/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/chat/[sessionId]/route.ts`
- `src/app/api/createSession/route.ts`
- `src/app/api/createSessionSimple/route.ts`
- `src/app/api/dbStatus/route.ts`
- `src/app/api/deleteChat/route.ts`
- `src/app/api/getenv/route.ts`
- `src/app/api/health/route.ts`
- `src/app/api/loadChats/route.ts`
- `src/app/api/memory/edges/route.ts`
- `src/app/api/memory/nodes/route.ts`
- `src/app/api/memory/process/route.ts`
- `src/app/api/memory/related/route.ts`
- `src/app/api/memory/route.ts`
- `src/app/api/memory/search/route.ts`
- `src/app/api/migrate/route.ts`
- `src/app/api/notes/[id]/route.ts`
- `src/app/api/notes/delete/route.ts`
- `src/app/api/notes/load/route.ts`
- `src/app/api/notes/save/route.ts`
- `src/app/api/prompts/[id]/route.ts`
- `src/app/api/prompts/route.ts`
- `src/app/api/saveChat/route.ts`
- `src/app/api/setenv/route.ts`
- `src/app/api/updateSchema/route.ts`
- `src/db/rxdb-schema.ts`
- `src/db/rxdb.ts`
- `src/lib/auth.ts`
- `src/lib/db-init.ts`
- `src/lib/memoryExtractor.ts`
- `src/lib/memoryVectors.ts`
- `src/lib/persona/errorMonitor.ts`
- `src/lib/persona/goalTracker.ts`
- `src/lib/persona/ideaNotetaker.ts`
- `src/lib/persona/interestProfiler.ts`
- `src/lib/persona/personaOrchestrator.ts`
- `src/lib/persona/personalityModeler.ts`
- `src/lib/persona/sentimentAnalyzer.ts`
- `src/lib/persona/toolsManager.ts`


### 4. Test Your Application

1. Start your application
2. Verify that all routes are working
3. Check that authentication is functioning
4. Confirm data persistence across restarts

### 5. Collections

The following collections are now available:

- `collections.HTMLObjectElement`
- `collections.react_server_dom_webpack_client`
- `collections._2`
- `collections._3`
- `collections.LOSS`
- `collections.next_server`
- `collections.__db_rxdb`
- `collections.__types`
- `collections.__lib_dataTransformers`
- `collections.__db`
- `collections.__lib_auth`
- `collections.next_headers`
- `collections.__lib_memoryVectors`
- `collections.next_auth`
- `collections.__lib_authOptions`
- `collections.__lib_memoryExtractor`
- `collections.rxdb`
- `collections.rxdb_plugins_storage_localstorage`
- `collections.rxdb_plugins_dev_mode`
- `collections.rxdb_plugins_validate_ajv`
- `collections.__rxdb_schema`
- `collections.bcryptjs`
- `collections.jsonwebtoken`
- `collections.___types`
- `collections._pinecone_database_pinecone`
- `collections.__vectorstore`
- `collections.__db_schema`
- `collections.error_events`
- `collections.goal_metrics`
- `collections.idea_nodes`
- `collections.interest_metrics`
- `collections.__sentimentAnalyzer`
- `collections.__interestProfiler`
- `collections.__goalTracker`
- `collections.__personalityModeler`
- `collections.__errorMonitor`
- `collections.__toolsManager`
- `collections.__ideaNotetaker`
- `collections.sentiment_metrics`
- `collections.tool_usages`
- `collections.personality_traits`

### 6. Admin Credentials

```
Username: admin
Password: admin123
```

**⚠️ IMPORTANT**: Change the admin password immediately in production!

### 7. API Reference

#### Find Operations

```javascript
// Find all documents
const users = await collections.users.find({});

// Find with query
const adults = await collections.users.find({ age: { $gt: 18 } });

// Find one document
const user = await collections.users.findOne({ username: 'john' });
```

#### Insert Operations

```javascript
// Insert single document
await collections.users.insert({
  username: 'john',
  email: 'john@example.com',
  createdAt: new Date().toISOString()
});

// Batch insert
await collections.users.insertBatch([
  { username: 'alice', email: 'alice@example.com' },
  { username: 'bob', email: 'bob@example.com' }
]);
```

#### Update Operations

```javascript
// Update one document
await collections.users.updateOne(
  { username: 'john' },
  { $set: { email: 'newemail@example.com' } }
);

// Update many documents
await collections.users.updateMany(
  { active: false },
  { $set: { status: 'inactive' } }
);
```

#### Delete Operations

```javascript
// Delete one document
await collections.users.deleteOne({ username: 'john' });

// Delete many documents
await collections.users.deleteMany({ active: false });
```

#### Reactive Queries

```javascript
// Subscribe to changes
const unsubscribe = collections.users.subscribe(
  { role: 'admin' },
  (results) => {
    console.log('Admin users:', results);
  }
);

// Unsubscribe when done
unsubscribe();
```

## Troubleshooting

### Database Not Persisting Data

Ensure the data directory has write permissions:
- Check the console output for the data directory path
- Verify directory permissions
- Ensure sufficient disk space

### Performance Issues

Enable query caching and indexing:

```javascript
const collection = db.collection('users', {
  indexes: [
    { name: 'username_idx', fields: ['username'], type: 'unique' },
    { name: 'email_idx', fields: ['email'], type: 'single' }
  ]
});
```

### Import Errors

Make sure the import path is correct relative to your file location.

## Additional Resources

- [NebulaDB Documentation](https://github.com/Nom-nom-hub/NebulaDB)
- [API Reference](https://github.com/Nom-nom-hub/NebulaDB#api-reference)
- [Examples](https://github.com/Nom-nom-hub/NebulaDB/tree/main/examples)

## Rollback

If you need to rollback the migration:

1. Stop your application
2. Restore from backup: [backup directory]
3. Run `npm install` to restore original dependencies

## Support

For issues or questions:
- GitHub Issues: https://github.com/Nom-nom-hub/NebulaDB/issues
- Documentation: https://github.com/Nom-nom-hub/NebulaDB
