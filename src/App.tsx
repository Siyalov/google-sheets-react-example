import { useEffect, useState } from 'react';
import './App.css';
import {
  API_KEY,
  spreadsheetId,
} from './settings';

function loadGAPIClient() {
  return new Promise((resolve) => {
    gapi.load('client', resolve);
  });
}

// type Table_v1 = { [key: string]: string[] };
type Row_v2 = { [key: string]: string };
type Table_v2 = Array<Row_v2>;

function App() {
  const [tableNames, setTableNames] = useState<Array<string>>([]);
  const [tables, setTables] = useState<Array<Table_v2>>([]);

  async function readSheet() {
    // init
    await loadGAPIClient();
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [
        // 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
        'https://sheets.googleapis.com/$discovery/rest?version=v4',
      ],
    });

    // get sheets
    const sheets = await gapi.client.sheets.spreadsheets.get({
      spreadsheetId,
    });
    // console.log(sheets.result.sheets);
    
    setTableNames(sheets.result.sheets?.map(sheet => {
      return sheet.properties?.title || '';
    }) || []);
    
    // get range A1 to Z1000 from first list
    // const data = await gapi.client.sheets.spreadsheets.values.get({
    //   spreadsheetId,
    //   range: 'A1:Z1000',
    // });
    // console.log(data.result);
    
    // format output
    // { "фио": ['', '', ...], "п.н.": ['', '', ...], ... }
    // const tables: Table_v1[] = [];
    // for (const sheet of (sheets.result.sheets || [])) {
    //   const table: Table_v1 = {};
    //   const allRows = await gapi.client.sheets.spreadsheets.values.get({
    //     spreadsheetId,
    //     range: `${sheet.properties?.title}!A1:Z1000`,
    //   });
    //   const rows = allRows.result.values || [];
    //   const headers = rows.shift() || [];
    //   for (const header of headers) {
    //     table[header] = [];
    //   }
    //   for (const row of rows) {
    //     for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
    //       const header = headers[columnIndex];
    //       const value = row[columnIndex];
    //       table[header].push(value);
    //     }
    //   }
    //   tables.push(table);
    // }

    // [{ "фио": "", "п.н.": "", ... }, ...]
    const tables: Table_v2[] = [];
    for (const sheet of (sheets.result.sheets || [])) {
      const table: Table_v2 = [];
      const allRows = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheet.properties?.title}!A1:Z1000`,
      });
      const rows = allRows.result.values || [];
      const headers = rows.shift() || [];

      for (const row of rows) {
        const rowObject: Row_v2 = {};
        for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
          const header = headers[columnIndex];
          const value = row[columnIndex];
          rowObject[header] = value;
        }
        table.push(rowObject);
      }
      tables.push(table);
    }

    // console.log(tables);
    setTables(tables);
  }

  useEffect(() => {
    readSheet();
  }, []);

  return (
    <div className="App">
      {tables.length ? tables.map((table, index) => {
        return (
          <table border={1}>
            <caption>{ tableNames[index] }</caption>
            <thead>
              <tr>
                {
                  Object.keys(table[0]).map(headerName =>
                    <th>{headerName}</th>
                  )
                }
              </tr>
            </thead>
            <tbody>
              {
                table.map(row => {
                  return <tr>
                    {
                      Object.keys(row).map(headerName =>
                        <td>{row[headerName]}</td>
                      )
                    }
                  </tr>
                })
              }
            </tbody>
          </table>
        )
      }) : 'loading..'}
    </div>
  );
}

export default App;
