/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.renameColumn('bookings', 'google_meet_link', 'meet_link')
  pgm.dropColumn('bookings', 'google_event_id')
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.addColumn('bookings', {
    google_event_id: { type: 'varchar(255)' },
  })
  pgm.renameColumn('bookings', 'meet_link', 'google_meet_link')
};
