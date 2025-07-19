# Expense Tracker Backend

## Database Migration Commands

### Generate Migration Files
```bash
# Create new migration for table
npm run migrate:create -- create-users-table

# Create new migration for modifying table
npm run migrate:create -- add-email-to-users

# Create new migration for removing table
npm run migrate:create -- remove-old-table
```

### Basic Migration Examples

1. Create Table:
```javascript
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
```

2. Add Column:
```javascript
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'email');
  }
};
```

3. Remove Table:
```javascript
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.dropTable('old_table');
  },
  async down(queryInterface, Sequelize) {
    // Restore table if needed
  }
};
```

### Run Migration Commands
```bash
# Run all pending migrations
npm run migrate

# Undo last migration
npm run migrate:undo

# Undo all migrations
npm run migrate:undo:all

# Run seeders
npm run seed

# Reset database (drop, create, migrate, seed)
npm run db:reset
``` 

## ✅ Database Setup Complete!

The database has been:
1. **Dropped** - Removed the old database with conflicting data
2. **Created** - Created a fresh database
3. **Migrated** - All migrations applied successfully, including the new category structure

## 🎉 Ready to Test!

Now you can start the application and test the category system:

```bash
npm run dev
```

The system is now ready with:
- ✅ **Fresh database** with proper schema
- ✅ **User-specific default categories** (created on registration)
- ✅ **All TypeScript errors resolved**
- ✅ **Clean architecture** (no global seeders needed)

When users register, they'll automatically get their own copy of default categories, and they can add their own custom categories while being protected from editing/deleting the default ones! 