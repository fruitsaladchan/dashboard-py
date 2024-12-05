function updateProgressColors(elementId, percentage) {
  const element = document.getElementById(elementId);
  if (!element) return;

  if (percentage >= 90) {
    element.style.backgroundColor = "#dc3545"; // red for critical
  } else if (percentage >= 70) {
    element.style.backgroundColor = "#ffc107"; // yellow for warning
  } else {
    element.style.backgroundColor = "#198754"; // green for normal
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

// Initial animation when page loads
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

        updateProgressColors("battery-progress", data.battery.percent);
      }

      updateProgressColors("cpu-progress", data.cpu_percent);
      updateProgressColors("memory-progress", data.memory_percent);
      updateProgressColors("storage-progress", data.disk_percent);
      updateProgressColors("network-up-progress", data.network_up_percent);
      updateProgressColors("network-down-progress", data.network_down_percent);
    });
}

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
