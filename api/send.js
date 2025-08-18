async function send() {
  const message = chatMessage.value.trim();

  // 🔹 Test rapide pour debug
  console.log("recipient :", currentRecipient);
  console.log("message :", message);

  if (!currentRecipient) {
    alert("Sélectionne un destinataire avant d'envoyer !");
    return;
  }

  if (!message) {
    alert("Écris un message !");
    return;
  }

  addMessage(message, true);
  chatMessage.value = '';

  const res = await fetch('/api/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient: currentRecipient, message })
  });

  const data = await res.json();
  if (!data.ok) {
    if (res.status === 401) {
      window.location.href = '/login.html';
    } else {
      alert('Erreur : ' + (data.error || 'inconnue'));
    }
  }
}
