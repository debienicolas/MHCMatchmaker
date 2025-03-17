import React from 'react';
import './inputInstructions.css';
import exampleCsv from './example_data/example_data.csv'; // Make sure this path is correct
import exampleExcel from './example_data/example_data.xlsx'; // Make sure this path is correct

function InputInstructions() {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = exampleCsv;
    link.download = 'example_CSV.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadExcel = () => {
    const link = document.createElement('a');
    link.href = exampleExcel;
    link.download = 'example_Excel.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container">
      <h1>File Upload Instructions</h1>
      

      <div className="example-section">
        <div className="example-header">
          <h2>Excel Example:</h2>
          <button className="download-button" onClick={handleDownloadExcel}>
            Download Example Excel
          </button>
        </div>
        <p>The excel file should have the following format:</p>
        <ul>
          <li>The first row should be a header row with the first column title "identifier" and the second column title "type"</li>
          <li>The rest of the columns can be custom and can be used for any purpose</li>
          <li>The following rows should have the identifier and type in the first two columns and the alleles in the haplotype in the following columns</li>
          <li>All cells below the last row should be empty</li>
        </ul>

        <div className="table-container">
          <table className="csv-table">
            <thead>
              <tr>
                <th>identifier</th>
                <th>type</th>
                <th></th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>pig1</td>
                <td>Donor</td>
                <td>SLA-1*14:05</td>
                <td>SLA-1*08:05</td>
                <td>SLA-2*06:08</td>
              </tr>
              <tr>
                <td>pig2</td>
                <td>Donor</td>
                <td>SLA-1*02:02</td>
                <td>SLA-1*08:03</td>
                <td>SLA-9*04:01</td>
              </tr>
              <tr>
                <td>mamu1</td>
                <td>Recipient</td>
                <td>Mamu-E*02:30</td>
                <td>Mamu-AG1*05:12:01:04</td>
                <td>Mamu-A1*022:01:01:01</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>


      <div className="example-section">
        <div className="example-header">
          <h2>CSV Example:</h2>
          <button className="download-button" onClick={handleDownload}>
            Download Example CSV
          </button>
        </div>
        <p>CSV files should have the following format:</p>
        <ul>
          <li>The first row should be a header row with the following column names: "identifier", "type", "haplotype"</li>
          <li>The first column should contain the donor/recipient identifier or name</li>
          <li>The second column should specify donor or recipient</li>
          <li>The third column should contain the haplotype (class I and class II together)</li>
          <li>Each row represents a single donor or recipient</li>
        </ul>
        <div className="table-container">
          <table className="csv-table">
            <thead>
              <tr>
                <th>identifier</th>
                <th>type</th>
                <th>haplotype</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>pig1</td>
                <td>Donor</td>
                <td>['SLA-1*14:05', 'SLA-1*08:05', 'SLA-2*06:08', 'SLA-DQA*02:06', 'SLA-DQA*02:08', 'SLA-DQA*01:02', 'SLA-DQB1*06:03', 'SLA-DQB1*02:09', 'SLA-DQB1*10:02', 'SLA-DRA*02:02:03', 'SLA-DRA*04:01:03', 'SLA-DRA*01:01:03', 'SLA-DRB2*12:01', 'SLA-DRB1*06:01', 'SLA-DRB2*05:01']</td>
              </tr>
              <tr>
                <td>pig2</td>
                <td>Donor</td>
                <td>['SLA-1*02:02', 'SLA-1*08:03', 'SLA-9*04:01', 'SLA-DQA*02:02:01', 'SLA-DQA*02:05', 'SLA-DQA*05:01', 'SLA-DQB1*02:01', 'SLA-DQB1*08:04', 'SLA-DQB1*05:01', 'SLA-DRA*04:01', 'SLA-DRA*04:01:02', 'SLA-DRA*01:01:04', 'SLA-DRB1*04:10', 'SLA-DRB1*09:01:02', 'SLA-DRB1*09:05']</td>
              </tr>
              <tr>
                <td>mamu1</td>
                <td>Recipient</td>
                <td>['Mamu-E*02:30', 'Mamu-AG1*05:12:01:04', 'Mamu-A1*022:01:01:01', 'Mamu-DQA1*26:08:01', 'Mamu-DQA1*26:02:01:01', 'Mamu-DQA1*05:02:01:02', 'Mamu-DQB1*18:30:01:01', 'Mamu-DQB1*28:01:01:01', 'Mamu-DQB1*18:01:01:01', 'Mamu-DRA*01:03:02', 'Mamu-DRA*01:02:01:02', 'Mamu-DRA*01:04:06', 'Mamu-DRB5*03:01:01:01', 'Mamu-DRB1*10:17', 'Mamu-DRB3*04:02']</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="note-section">
        <p>Not following the format will result in errors when uploading the data.</p>
      </div>
    </div>
  );
}

export default InputInstructions;