const ROLE_DEFINITIONS = {
  Browser: {
    Name: 'Browser',
    Description: 'May view folders, reports and subscribe to reports.'
  },
  'Content Manager': {
    Name: 'Content Manager',
    Description: 'May manage content in the Report Server. This includes folders, reports and resources.'
  },
  'My Reports': {
    Name: 'My Reports',
    Description: 'May publish reports and linked reports; manage folders, reports and resources in a users My Reports folder.'
  },
  Publisher: {
    Name: 'Publisher',
    Description: 'May publish reports and linked reports to the Report Server.'
  },
  'Report Builder': {
    Name: 'Report Builder',
    Description: 'May view report definitions.'
  }
};

const ROLE_NAMES = Object.keys(ROLE_DEFINITIONS);

module.exports = {
  ROLE_DEFINITIONS,
  ROLE_NAMES
};

