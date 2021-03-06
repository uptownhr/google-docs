import * as fs from 'fs'
import * as readline from 'readline'
import {google} from 'googleapis'


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Docs API.
  authorize(JSON.parse(content.toString()), async (auth) => {
    await docToPDF(auth, '1_umZmyJUil3mZtY4HvEZe_Pik44FZ5zo5mq-GweUym8')


    /*printDocTitle(auth)
    const doc = await createDoc(auth, `Test API - ${Date.now()}`)
    console.log('doc', doc)
    const clone = await copyDoc(auth, doc.documentId)
    console.log('cloned', clone)*/
  });
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token.toString()));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Prints the title of a sample doc:
 * https://docs.google.com/document/d/195j9eDD3ccgjQRttHhJPymLJUCOUjs-jmwTrekvdjFE/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth 2.0 client.
 */
function printDocTitle(auth) {
  const docs = google.docs({version: 'v1', auth});
  docs.documents.get({
    documentId: '195j9eDD3ccgjQRttHhJPymLJUCOUjs-jmwTrekvdjFE',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    console.log(`The title of the document is: ${res.data.title}`);
  });
}

/*
document.create only accepts Title
 */
async function createDoc (auth, docTitle) {
  const docs = google.docs({version: 'v1', auth});

  const response = await docs.documents.create({
    requestBody: {
      title: docTitle,
    }
  })

  return response.data
}

async function copyDoc (auth, documentId) {
  const drive = google.drive({version: 'v3', auth});
  const copyTitle = "Copy Title";

  const response = await drive.files.copy({
    fileId: documentId,
    requestBody: {
      name: copyTitle + ' - ' + Date.now(),

    }
  });

  return response.data
}

interface driveFilesExportArrayBuffer {
  config: object;
  data: ArrayBuffer;
}

async function docToPDF (auth, documentId) {
  const drive = google.drive({version: 'v3', auth});
  const dest = fs.createWriteStream('/tmp/resume.pdf');

  const test :any = await drive.files.export({
    fileId: documentId,
    mimeType: 'application/pdf'
  }, {
    responseType: 'arraybuffer'
  })

  const arraybuffer: ArrayBuffer = test.data

  console.log(Object.keys(test))
  console.log(test.config, test.headers, test.status, test.request)
  console.log(test.data)

  fs.writeFile('test.pdf', new Buffer(arraybuffer), err => {
    console.log(err)
  })

  /*return new Promise((resolve, reject) => {
    drive.files.export({
      fileId: documentId,
      mimeType: 'application/pdf'
    })
      .on('end', resolve)
      .on('error', reject)
      .pipe(dest);
  })*/
}
