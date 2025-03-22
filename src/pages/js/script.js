// Display the base URL when the page loads
document.addEventListener("DOMContentLoaded", function () {
  // Get the base URL from the server or use the current origin
  const baseUrl = window.location.origin;
  document.getElementById("baseUrlDisplay").textContent = baseUrl + "/";
});

// Add this function to validate custom codes
function validateCustomCode(code) {
  if (!code) return true; // Empty is valid (will generate random code)

  // Check length
  if (code.length < 3) {
    return "Custom URL must be at least 3 characters long";
  }

  if (code.length > 50) {
    return "Custom URL must be less than 50 characters";
  }

  // Check for valid characters (letters, numbers, hyphens, underscores)
  if (!/^[a-zA-Z0-9-_]+$/.test(code)) {
    return "Custom URL can only contain letters, numbers, hyphens, and underscores";
  }

  // Check for reserved words that might conflict with your API routes
  const reservedWords = [
    "api",
    "admin",
    "shorten",
    "stats",
    "login",
    "register",
  ];
  if (reservedWords.includes(code.toLowerCase())) {
    return "This custom URL is reserved and cannot be used";
  }

  return true; // Valid
}

async function checkCustomUrlAvailability() {
  const customCode = document.getElementById("customCode").value.trim();

  if (!customCode) {
    return; // No need to check if empty
  }

  // Validate format first
  const validationResult = validateCustomCode(customCode);
  if (validationResult !== true) {
    document.getElementById("customCodeAvailability").textContent =
      validationResult;
    document.getElementById("customCodeAvailability").className =
      "availability-error";
    return;
  }

  try {
    const response = await fetch(
      `/api/check-availability?code=${encodeURIComponent(customCode)}`
    );
    const data = await response.json();

    if (data.available) {
      document.getElementById("customCodeAvailability").textContent =
        "✓ Available";
      document.getElementById("customCodeAvailability").className =
        "availability-success";
    } else {
      document.getElementById("customCodeAvailability").textContent =
        "✗ Already taken";
      document.getElementById("customCodeAvailability").className =
        "availability-error";
    }
  } catch (error) {
    console.error("Error checking availability:", error);
  }
}

// Add event listener for the custom code input
document.addEventListener("DOMContentLoaded", function () {
  // Get the base URL from the server or use the current origin
  const baseUrl = window.location.origin;
  document.getElementById("baseUrlDisplay").textContent = baseUrl + "/";

  // Add debounced event listener for custom code input
  const customCodeInput = document.getElementById("customCode");
  let debounceTimer;

  customCodeInput.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(checkCustomUrlAvailability, 500);
  });
});

async function shortenUrl() {
  const originalUrl = document.getElementById("originalUrl").value;
  const customCode = document.getElementById("customCode").value.trim();

  if (!originalUrl) {
    alert("Please enter a URL");
    return;
  }

  // Validate custom code if provided
  const validationResult = validateCustomCode(customCode);
  if (validationResult !== true) {
    alert(validationResult);
    return;
  }

  try {
    const response = await fetch("/shorten", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        originalUrl,
        customCode: customCode || undefined, // Only send if not empty
      }),
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
