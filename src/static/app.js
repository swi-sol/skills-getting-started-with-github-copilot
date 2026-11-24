document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    // Hide message after 5 seconds
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function unregisterParticipant(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Built with DOM APIs (not innerHTML) because emails are user-supplied
  function createParticipantsSection(activityName, participants) {
    const section = document.createElement("div");
    section.className = "participants";

    const heading = document.createElement("h5");
    heading.textContent = "Participants ";
    const count = document.createElement("span");
    count.className = "participant-count";
    count.textContent = participants.length;
    heading.appendChild(count);
    section.appendChild(heading);

    if (participants.length === 0) {
      const empty = document.createElement("p");
      empty.className = "no-participants";
      empty.textContent = "No one has signed up yet — be the first!";
      section.appendChild(empty);
      return section;
    }

    const list = document.createElement("ul");
    participants.forEach((email) => {
      const item = document.createElement("li");

      const emailSpan = document.createElement("span");
      emailSpan.className = "participant-email";
      emailSpan.textContent = email;

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "delete-participant";
      deleteBtn.title = `Unregister ${email}`;
      deleteBtn.setAttribute("aria-label", `Unregister ${email} from ${activityName}`);
      deleteBtn.textContent = "🗑️";
      deleteBtn.addEventListener("click", () => unregisterParticipant(activityName, email));

      item.append(emailSpan, deleteBtn);
      list.appendChild(item);
    });
    section.appendChild(list);
    return section;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message and previously loaded options
      activitiesList.innerHTML = "";
      activitySelect.querySelectorAll("option:not([value=''])").forEach((opt) => opt.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activityCard.appendChild(createParticipantsSection(name, details.participants));
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
