(function () {
  const resources = performance.getEntriesByType("resource")
  const url = resources[resources.length - 1].name
  
  const requestUrl = (i) => {
    let urlParts = url.split(/page=\d/)
    return [urlParts[0], `page=${i}`, urlParts[1]].join('')
  }

  const fileName = () => {
    let matchExpression = /\/(\w*)\/(\w*)\?/
    let matches = matchExpression.exec(url)
    
    if (matches.length === 3) {
      return `${matches[1]}_${matches[2]}-${(new Date).toString()}.csv`
    }
  }

  let numberOfPages
  let results = []

  // make the first request to get the total number of pages for the table
  const makeFirstRequest = async () => {
    await fetch(requestUrl(0))
    .then((response) => {
      return response.json()
    })
    .then((json) => {
      results = results.concat(json.content)
      numberOfPages = json.totalPages
    })
  }

  const makeRequests = async () => {
    await makeFirstRequest()
    let requestPromises = []
    for(let i = 1; i < numberOfPages; i++) {
      requestPromises.push(
        fetch(requestUrl(i))
        .then((response) => {
          return response.json()
        })
        .then((json) => {
          results = results.concat(json.content)
        })
      )
    }
    await Promise.all(requestPromises)
    downloadCsv()
  }

  const downloadCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,'
    let header = Object.keys(results[0]).join(',')
    csvContent += `${header}\n`

    results.forEach((rowObject, index) => {
      rowString = Object.values(rowObject).join(',')
      csvContent += (index < results.length ? `${rowString}\n` : rowString)
    })

    let encodedUri = encodeURI(csvContent)
    let link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', fileName())
    document.body.appendChild(link)
    link.click()
  }

  makeRequests()
})()

