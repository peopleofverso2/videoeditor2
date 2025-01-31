export const USER_STATUS = {
  ONLINE: 'online',
  BUSY: 'busy',
  AWAY: 'away',
  OFFLINE: 'offline'
};

export const USER_STATUS_LABELS = {
  [USER_STATUS.ONLINE]: 'En ligne',
  [USER_STATUS.BUSY]: 'Occupé',
  [USER_STATUS.AWAY]: 'Absent',
  [USER_STATUS.OFFLINE]: 'Hors ligne'
};

export const USER_STATUS_COLORS = {
  [USER_STATUS.ONLINE]: '#44b700',
  [USER_STATUS.BUSY]: '#ff3d00',
  [USER_STATUS.AWAY]: '#ff9100',
  [USER_STATUS.OFFLINE]: '#bdbdbd'
};
