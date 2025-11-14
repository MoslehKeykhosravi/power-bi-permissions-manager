const buildFullPath = (path, name) => {
  const normalizedPath = path || '/';
  if (normalizedPath === '/') {
    return `/${name}`;
  }
  return `${normalizedPath.replace(/\/$/, '')}/${name}`;
};

const mapPowerBiItem = (item, typeLabel) => ({
  id: item.Id,
  name: item.Name,
  path: item.Path || '/',
  type: typeLabel,
  fullPath: buildFullPath(item.Path, item.Name)
});

module.exports = {
  mapPowerBiItem
};

