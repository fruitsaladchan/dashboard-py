function updateProgressColors(elementId, percentage, reverse = false) {
  const element = document.getElementById(elementId);
  if (!element) return;

  if (reverse) {
    // reverse for battery
    if (percentage <= 20) {
      element.style.backgroundColor = "#dc3545";
    } else if (percentage <= 50) {
      element.style.backgroundColor = "#ffc107";
    } else {
      element.style.backgroundColor = "#93f2cc";
    }
  } else {
    if (percentage >= 90) {
      element.style.backgroundColor = "#dc3545";
    } else if (percentage >= 70) {
      element.style.backgroundColor = "#ffc107";
    } else {
      element.style.backgroundColor = "#93f2cc";
    }
  }
}

function animateCards() {
  const cards = document.querySelectorAll(".card");
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add("fade-in");
    }, index * 100);
  });
}

document.addEventListener("DOMContentLoaded", animateCards);

function updateStats() {
  fetch("/stats")
    .then((response) => response.json())
    .then((data) => {
      // greeting
      document.getElementById("greeting").textContent = data.greeting;
      document.getElementById("system-uptime").textContent = data.uptime;

      // time and date
      document.getElementById("current-time").textContent = data.time;
      document.getElementById("current-date").textContent = data.date;

      // system info
      document.getElementById("hostname").textContent = data.hostname;
      document.getElementById("os-info").textContent =
        `${data.os_info.system} ${data.os_info.release}` || "N/A";
      document.getElementById("os-distro").textContent = data.os_info.distro;
      document.getElementById("os-arch").textContent = data.os_info.machine;

      // network
      document.getElementById("private-ip").textContent = data.private_ip;
      document.getElementById("public-ip").textContent = data.public_ip;
      document.getElementById("mac-address").textContent = data.mac_address;

      // cpu
      document.getElementById("cpu-usage").textContent =
        data.cpu_percent.toFixed(1);
      document.getElementById("cpu-progress").style.width =
        `${data.cpu_percent}%`;
      document.getElementById("cpu-temp").textContent =
        data.cpu_temp.toFixed(1);
      document.getElementById("cpu-freq").textContent = data.cpu_freq;
      document.getElementById("cpu-cores").textContent = data.cpu_cores;
      document.getElementById("cpu-threads").textContent = data.cpu_threads;

      // memory
      document.getElementById("memory-usage").textContent =
        data.memory_percent.toFixed(1);
      document.getElementById("memory-progress").style.width =
        `${data.memory_percent}%`;
      document.getElementById("memory-used").textContent = data.memory_used;
      document.getElementById("memory-total").textContent = data.memory_total;

      // disk
      document.getElementById("storage-usage").textContent =
        data.disk_percent.toFixed(1);
      document.getElementById("storage-progress").style.width =
        `${data.disk_percent}%`;
      document.getElementById("storage-used").textContent = data.disk_used;
      document.getElementById("storage-total").textContent = data.disk_total;

      document.getElementById("network-up-speed").textContent =
        data.network_up_speed;
      document.getElementById("network-down-speed").textContent =
        data.network_down_speed;

      // up / down
      document.getElementById("network-up-progress").style.width =
        `${data.network_up_percent}%`;
      document.getElementById("network-down-progress").style.width =
        `${data.network_down_percent}%`;

      // process
      const processList = document.getElementById("process-list");
      processList.innerHTML = "";
      data.top_processes.forEach((process) => {
        const row = document.createElement("tr");
        row.innerHTML = `
                    <td>${process.name}</td>
                    <td>${process.cpu_percent?.toFixed(1) || 0}%</td>
                    <td>${process.memory_percent?.toFixed(1) || 0}%</td>
                `;
        processList.appendChild(row);
      });

      // users
      const usersList = document.getElementById("users-list");
      usersList.innerHTML = "";
      data.users.forEach((user) => {
        const userDiv = document.createElement("div");
        userDiv.className = "user-item";
        userDiv.innerHTML = `
                    <div class="user-name">${user.name}</div>
                    <div class="user-details">
                        <span>${user.terminal || "N/A"}</span>
                        <span>${user.started}</span>
                    </div>
                `;
        usersList.appendChild(userDiv);
      });

      // fans
      const fansList = document.getElementById("fans-list");
      fansList.innerHTML = "";
      data.fans.forEach((fan) => {
        const fanDiv = document.createElement("div");
        fanDiv.className = "fan-item";
        fanDiv.innerHTML = `
                    <div class="fan-name">${fan.name}</div>
                    <div class="fan-speed">${fan.speed} RPM</div>
                `;
        fansList.appendChild(fanDiv);
      });

      // battery
      if (data.battery) {
        document.getElementById("battery-percent").textContent =
          data.battery.percent;
        document.getElementById("battery-progress").style.width =
          `${data.battery.percent}%`;

        const batteryStatus = document.getElementById("battery-status");
        batteryStatus.textContent = data.battery.power_plugged
          ? "(Plugged In)"
          : "(On Battery)";

        const batteryTime = document.getElementById("battery-time");
        if (data.battery.time_left) {
          const hours = Math.floor(data.battery.time_left / 3600);
          const minutes = Math.floor((data.battery.time_left % 3600) / 60);
          batteryTime.textContent = `${hours}h ${minutes}m`;
        } else {
          batteryTime.textContent = data.battery.power_plugged
            ? "Fully Charged"
            : "Calculating...";
        }

        updateProgressColors("battery-progress", data.battery.percent, true);
      }

      updateProgressColors("cpu-progress", data.cpu_percent);
      updateProgressColors("memory-progress", data.memory_percent);
      updateProgressColors("storage-progress", data.disk_percent);
      updateProgressColors("network-up-progress", data.network_up_percent);
      updateProgressColors("network-down-progress", data.network_down_percent);
    });
}

function confirmPowerAction(action) {
  const capitalizedAction = action.charAt(0).toUpperCase() + action.slice(1);
  const confirmed = confirm(`Are you sure you want to ${action} the system?`);

  if (confirmed) {
    fetch(`/power/${action}`, {
      method: "POST",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          alert(`${capitalizedAction} initiated`);
        } else {
          alert("Action failed: " + data.message);
        }
      })
      .catch((error) => {
        alert("Error: " + error.message);
      });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const powerButtons = {
    "shutdown-btn": "shutdown",
    "restart-btn": "restart",
    "sleep-btn": "sleep",
    "hibernate-btn": "hibernate",
  };

  Object.entries(powerButtons).forEach(([buttonId, action]) => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener("click", () => confirmPowerAction(action));
    }
  });
});

setInterval(updateStats, 2000);

updateStats();

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    const cards = document.querySelectorAll(".card");
    cards.forEach((card) => {
      card.classList.remove("fade-in");
    });
    void document.body.offsetHeight;
    animateCards();
  }
});
