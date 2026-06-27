/** @type {import('node-pg-migrate').ColumnDefinitions | undefined} */
export const shorthands = undefined

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export const up = (pgm) => {
  // 1. Add email column to the existing users table (needed for calendar invites)
  pgm.addColumn('users', {
    email: { type: 'varchar(255)', notNull: false, unique: true },
  })

  // 2. Create the time_slots table
  pgm.createTable('time_slots', {
    id: { type: 'serial', primaryKey: true },
    volunteer_id: {
      type: 'integer',
      references: '"users"',
      onDelete: 'CASCADE',
      notNull: true,
    },
    start_time: { type: 'timestamp with time zone', notNull: true },
    end_time: { type: 'timestamp with time zone', notNull: true },
    is_recurring: { type: 'boolean', default: false, notNull: true },
    minimum_notice_hours: { type: 'integer', default: 24, notNull: true },
    status: { type: 'varchar(50)', default: 'available', notNull: true },
  })

  // 3. Create the bookings table
  pgm.createTable('bookings', {
    id: { type: 'serial', primaryKey: true },
    slot_id: {
      type: 'integer',
      references: '"time_slots"',
      onDelete: 'CASCADE',
      notNull: true,
    },
    trainee_id: {
      type: 'integer',
      references: '"users"',
      onDelete: 'CASCADE',
      notNull: true,
    },
    agenda: { type: 'text' },
    google_meet_link: { type: 'varchar(500)' },
    created_at: {
      type: 'timestamp with time zone',
      default: pgm.func('current_timestamp'),
      notNull: true,
    },
  })

  // 4. Update the baseline demo data to match project requirements
  pgm.sql(`UPDATE users SET role = 'volunteer' WHERE name IN ('Alice García', 'Bob Mwangi');`)
  pgm.sql(`UPDATE users SET role = 'trainee' WHERE name = 'Carmen Liu';`)
  pgm.sql(`UPDATE users SET email = 'alice@example.com' WHERE name = 'Alice García';`)
  pgm.sql(`UPDATE users SET email = 'bob@example.com' WHERE name = 'Bob Mwangi';`)
  pgm.sql(`UPDATE users SET email = 'carmen@example.com' WHERE name = 'Carmen Liu';`)
}

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
export const down = (pgm) => {
  pgm.dropTable('bookings')
  pgm.dropTable('time_slots')
  pgm.dropColumn('users', 'email')
}
