from flask import Flask, render_template, jsonify
import logging
import psutil
import platform
from datetime import datetime
import socket
import getpass
import distro
import requests
import uuid
import time

app = Flask(__name__)

last_net_io = None
last_net_time = None
net_speed_max = 1000000
log = logging.getLogger("werkzeug")
log.disabled = True
app.logger.disabled = True


def get_greeting():
    hour = datetime.now().hour
    username = getpass.getuser()

    if 5 <= hour < 12:
        greeting = "Good Morning"
    elif 12 <= hour < 17:
        greeting = "Good Afternoon"
    elif 17 <= hour < 22:
        greeting = "Good Evening"
    else:
        greeting = "Good Night"

    return f"{greeting}, {username}"


def get_size(bytes):
    for unit in ["", "K", "M", "G", "T", "P"]:
        if bytes < 1024:
            return f"{bytes:.2f}{unit}B"
        bytes /= 1024


def get_private_ip():
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/stats")
def get_stats():
    # stats
    cpu_percent = psutil.cpu_percent(interval=1)
    cpu_freq = psutil.cpu_freq()
    cpu_count = psutil.cpu_count()
    cpu_count_logical = psutil.cpu_count(logical=True)

    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/")

    # OSinfo
    try:
        os_info = {
            "system": platform.system(),
            "release": platform.release(),
            "version": platform.version(),
            "machine": platform.machine(),
            "distro": (
                f"{distro.name()} {distro.version()}"
                if platform.system() == "Linux"
                else platform.system()
            ),
        }
    except:
        os_info = {
            "system": platform.system(),
            "release": platform.release(),
            "version": "N/A",
            "machine": platform.machine(),
            "distro": platform.system(),
        }

    # network info
    global last_net_io, last_net_time, net_speed_max

    net = psutil.net_io_counters()
    current_time = time.time()

    if last_net_io and last_net_time:
        time_elapsed = current_time - last_net_time
        upload_speed = (net.bytes_sent - last_net_io.bytes_sent) / time_elapsed
        download_speed = (net.bytes_recv - last_net_io.bytes_recv) / time_elapsed

        net_speed_max = max(net_speed_max, upload_speed, download_speed)
    else:
        upload_speed = 0
        download_speed = 0

    last_net_io = net
    last_net_time = current_time

    hostname = socket.gethostname()
    private_ip = get_private_ip()

    # Get MAC address
    mac_address = ":".join(
        [
            "{:02x}".format((uuid.getnode() >> elements) & 0xFF)
            for elements in range(0, 2 * 6, 2)
        ][::-1]
    )

    # pub IP
    try:
        public_ip = requests.get("https://api.ipify.org").text
    except:
        public_ip = "Unable to fetch"

    # processes info
    processes = []
    for proc in sorted(
        psutil.process_iter(["name", "cpu_percent", "memory_percent"]),
        key=lambda x: x.info["cpu_percent"] or 0,
        reverse=True,
    )[:5]:
        try:
            processes.append(
                {
                    "name": proc.info["name"],
                    "cpu_percent": proc.info["cpu_percent"],
                    "memory_percent": proc.info["memory_percent"],
                }
            )
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    users = []
    for user in psutil.users():
        users.append(
            {
                "name": user.name,
                "terminal": user.terminal,
                "started": datetime.fromtimestamp(user.started).strftime(
                    "%Y-%m-%d %I:%M"
                ),
            }
        )

    try:
        temperatures = psutil.sensors_temperatures()
        cpu_temp = (
            temperatures["coretemp"][0].current if "coretemp" in temperatures else 0
        )

        fans = psutil.sensors_fans() if hasattr(psutil, "sensors_fans") else {}
        fan_speeds = []
        for fan_name, fan_readings in fans.items():
            for fan in fan_readings:
                fan_speeds.append({"name": fan_name, "speed": fan.current})
    except:
        cpu_temp = 0
        fan_speeds = []

    # battery
    battery = psutil.sensors_battery()
    battery_info = (
        {
            "percent": round(battery.percent, 0) if battery else 0,
            "power_plugged": battery.power_plugged if battery else None,
            "time_left": (
                battery.secsleft if battery and battery.secsleft != -1 else None
            ),
        }
        if battery
        else None
    )

    return jsonify(
        {
            "time": datetime.now().strftime("%I:%M"),
            "date": datetime.now().strftime("%A, %B, %d, %Y"),
            "greeting": get_greeting(),
            "time": datetime.now().strftime("%I:%M"),
            "cpu_percent": cpu_percent,
            "cpu_temp": cpu_temp,
            "cpu_freq": round(cpu_freq.current, 2) if cpu_freq else 0,
            "cpu_cores": cpu_count,
            "cpu_threads": cpu_count_logical,
            "memory_percent": memory.percent,
            "memory_used": get_size(memory.used),
            "memory_total": get_size(memory.total),
            "disk_percent": disk.percent,
            "disk_used": get_size(disk.used),
            "disk_total": get_size(disk.total),
            "os_info": os_info,
            "network_up_speed": get_size(upload_speed) + "/s",
            "network_down_speed": get_size(download_speed) + "/s",
            "network_up_percent": min(100, (upload_speed / net_speed_max) * 100),
            "network_down_percent": min(100, (download_speed / net_speed_max) * 100),
            "hostname": hostname,
            "private_ip": private_ip,
            "public_ip": public_ip,
            "mac_address": mac_address.upper(),
            "top_processes": processes,
            "users": users,
            "fans": fan_speeds,
            "battery": battery_info,
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
