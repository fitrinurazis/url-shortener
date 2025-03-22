async function shortenUrl() {
  const originalUrl = document.getElementById("originalUrl").value;

  if (!originalUrl) {
    alert("Please enter a URL");
    return;
  }

  try {
    const response = await fetch("/shorten", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ originalUrl }),
    });

    const data = await response.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    const shortUrlElement = document.getElementById("shortUrl");
    shortUrlElement.textContent = data.shortUrl;
    shortUrlElement.href = data.shortUrl;
    document.getElementById("originalUrlDisplay").textContent =
      data.originalUrl;
    document.getElementById("result").style.display = "block";
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred. Please try again.");
  }
}

function copyToClipboard() {
  const shortUrl = document.getElementById("shortUrl").textContent;
  navigator.clipboard
    .writeText(shortUrl)
    .then(() => {
      alert("URL copied to clipboard!");
    })
    .catch((err) => {
      console.error("Could not copy text: ", err);
    });
}
