const issueBtn = document.getElementById('issueBtn');
const issueResult = document.getElementById('issueResult');
const fileInput = document.getElementById('file');
const subjectInput = document.getElementById('subjectId');

const verifyBtn = document.getElementById('verifyBtn');
const verifyResult = document.getElementById('verifyResult');
const jwtInput = document.getElementById('jwt');

const getBtn = document.getElementById('getBtn');
const getResult = document.getElementById('getResult');
const docIdInput = document.getElementById('docId');

issueBtn.addEventListener('click', async () => {
  if (!fileInput.files.length) {
    issueResult.textContent = 'Please select a file';
    return;
  }
  const fd = new FormData();
  fd.append('file', fileInput.files[0]);
  fd.append('subjectId', subjectInput.value || 'did:example:alice');
  issueResult.textContent = 'Uploading...';
  try {
    const res = await fetch('/api/issueCredential', { method: 'POST', body: fd });
    const data = await res.json();
    issueResult.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    issueResult.textContent = String(err);
  }
});

verifyBtn.addEventListener('click', async () => {
  const jwt = jwtInput.value.trim();
  if (!jwt) {
    verifyResult.textContent = 'Please paste a JWT';
    return;
  }
  verifyResult.textContent = 'Verifying...';
  try {
    const res = await fetch('/api/verifyCredential', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jwt }) });
    const data = await res.json();
    verifyResult.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    verifyResult.textContent = String(err);
  }
});

getBtn.addEventListener('click', async () => {
  const id = docIdInput.value.trim();
  if (!id) {
    getResult.textContent = 'Please enter a document id';
    return;
  }
  getResult.textContent = 'Fetching...';
  try {
    const res = await fetch(`/api/getCredential?id=${encodeURIComponent(id)}`);
    const data = await res.json();
    getResult.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    getResult.textContent = String(err);
  }
});
