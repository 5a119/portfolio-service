import {prepareResumeFiles} from '../server/_lib/private-resume.js';

await prepareResumeFiles();
console.log('Private résumé and access signing key are ready for the server bundle.');
