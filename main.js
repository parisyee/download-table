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
    let csvContent = ''
    let columnNames = []

    results.forEach((rowObject, index) => {
      let columnsInRow = Object.keys(rowObject)

      columnsInRow.forEach((column) => {
        if (columnNames.indexOf(column) < 0) {
          columnNames.push(column)
        }
      })

      let rowValues = []

      columnNames.forEach((column) => {
        if (rowObject[column]) {
          rowValues.push(rowObject[column])
        } else {
          rowValues.push('')
        }
      })
      
      if (index < results.length) {
        csvContent += `${rowValues.join(',')}\n`
      } else {
        csvContent += rowValues.join(',')
      }
    })
    
    csvContent = `data:text/csv;charset=utf-8,${columnNames.join(',')}\n${csvContent}`

    let encodedUri = encodeURI(csvContent)
    let link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', fileName())
    document.body.appendChild(link)
    link.click()
  }

  makeRequests()
})()

