(async () => {
  const meiliEndpoint = 'http://localhost:7700';
  await fetch(`${meiliEndpoint}/indexes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      "uid": "altered-cards",
      "primaryKey": "id"
    }),
  }).then((response) => {
    if (!response.ok) {
      throw new Error('Failed to create index');
    }
  });

  await fetch(`${meiliEndpoint}/indexes/altered-cards/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      "searchableAttributes": [
        "name",
        "text",
      ],
      "filterableAttributes": ["setCode", "lang", "name", "collectorNumber"],
      "sortableAttributes": ["collectorNumber"],
    }),
  }).then((response) => {
    if (!response.ok) {
      throw new Error('Failed to setup index');
    }
  });
})();