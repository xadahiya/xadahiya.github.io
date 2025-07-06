---
layout: post
title: Finishing up!
category: GSoC
image: https://lh3.googleusercontent.com/-RLc8chMXXv2wOj9lvZBOGNzcCVUW3CMlI3GE9TYfOoeWvyLN36xSfcCWnlflCxLCc0_f7T_CCu05mx1TZMK35SdC9PSjv8
tags: [GSoC, Hydra, Semantic Web, Hydrus]
---

Alright, folks! We've hit the [GSoC](https://summerofcode.withgoogle.com/) final evaluations, and it's time to wrap things up. In this post, I'll give you a quick rundown of what we managed to pull off in the last three months.

We tackled two main projects: [Hydrus](https://github.com/HTTP-APIs/hydrus) and a [Forestry Patrol Simulation](https://github.com/HTTP-APIs/hydra-flock-demo). The simulation uses various Hydrus instances with a cool mechanics layer on top.

I've already blabbed about Hydrus in another post, so this time, I'll give you the lowdown on the simulation.


General Idea
=============
The Hydra Flock Simulation is this neat application that simulates a bunch of drones flying around. Their mission? To detect fires or weird hot spots in a specific area using infrared sensors. Pretty cool, huh? The simulation runs on [Hydrus](https://github.com/HTTP-APIs/hydrus/) and [Hydra-py](https://github.com/pchampin/hydra-py).

Running the Simulation
==============
Getting this simulation up and running is super easy, you just need to run two scripts. First, clone the simulation repo to your local system using `git clone https://github.com/HTTP-APIs/hydra-flock-demo` and then follow these steps:
* Create and activate a new virtualenv
* Upgrade pip and setuptools
* Check if `python3-dev` is installed
* `cd` to the project directory
* Run `chmod +x bootstrap-dev.sh`
* Run `./bootstrap-dev.sh`
* Run `chmod +x init.sh`
* Run `./bootstrap-dev.sh`

**Simulation GUI should be available at `http://127.0.0.1:5000/`**<br/>

**Central Controller should be available at `http://127.0.0.1:8080/api`**<br/>

**Drones should be available at**<br/>
- Drone 1 - `http://127.0.0.1:8081/api`
- Drone 2 - `http://127.0.0.1:8082/api`
- Drone 3 - `http://127.0.0.1:8083/api`
- Drone 4 - `http://127.0.0.1:8084/api`

### **NOTE**: To stop all simulation processes use `killall python`

Interacting with the simulation
==================
You can totally interact with the simulation right from the GUI! Just submit messages in a structured format to the central controller. It'll then parse your message and send commands to the right drones. You can even watch the progress in the controller and drone logs in the GUI. Pretty neat, huh?

### Some general information
- Supported Directions are [**N**, **S**, **E**, **W**]
- The user can only turn drones ON (`Active`) or Off (`Off`), rest all the states are automatically handled by the drone mechanics. To read more about the drone mechanics, read the [drone design](https://github.com/HTTP-APIs/hydra-flock-demo/wiki/Drone-Design) page.
- Speed can be any number less than the `MaxSpeed` value of the drone, for any value greater than `MaxSpeed`, drones will use the `MaxSpeed` value.


**Some Examples**
- `Set Drone 2 speed 100` (Change the speed of drone with id 2 to 100 Km/h.)
- `Set Drone 8 direction N` (Change the direction of drone with id 8 to North.)
- `Set Drone 13 status off` (Turn drone with id 13 off.)
- `Set Drone 8 status active` (Turn drone with id 8 on.)

**NOTE:-**  Changing the drone direction won't work if the drone is in `Confirming` state.

Central Controller design
===============
The central controller is basically a Hydra-based API server that acts as the main data hub and control center for all the drones. All the active drones send their status updates every 15 seconds to this central controller. Just like the drones, the central controller also has a client part that you can use to send commands to different drones.

### Main Features
- It acts as a central database for all the drones to store their logs and sensor data. This is being done using the drone client side, drones issue POST/PUT requests after every 15 seconds or upon some status change. The central controller has different endpoints for different types of data.
    - `/api/DroneCollection/<drone_id>` Each active drone updates their drone object using `PUT/POST` requests here, every 15 seconds.
    - `/api/DatastreamCollection/` Datastream from the drone sensors is stored here.
    - `/api/DroneLogCollection/` Logs related to drones are stored here.
    - `/api/ControllerLogCollection` Logs related to the controller are stored here.
    - `/api/HttpApiLogCollection` Logs related to general interactions between different components are stored here.
- The user can issue a message to the central controller at `/api/MessageCollection/` in a structured format. The message is then parsed and commands are issued to the respective drones.
- The server will act as an intermediate if different drones want to interact with each other. For example -  If some drone wants to know the position of all nearby drones.
- The central controller acts as the main docking station to recharge drones.

The Central controller is driven by a 17 second time loop (2-second delay to let drones finish updating their status at the controller).

### Main Loop design
```python
"""Main loop for the central controller."""
    print("Controller Simulation Loop")
    try:
        handle_messages()
        handle_anomalies()

    except Exception as e:
        print(e)

    finally:
        threading.Timer(LOOP_TIME, main).start()
```
In the main Loop, the controller tries to handle two things.
- The messages submitted by the user
- Anomalies detected by drones

### Handling Messages
```python
"""Handle messages in the MessageCollection."""
    try:
        message_collection = get_message_collection()
        print(message_collection)

        for message in message_collection:
            regex = r'/(.*)/(\d*)'
            matchObj = re.match(regex, message["@id"])
            if matchObj:
                message_id = matchObj.group(2)
                message_details = get_message(message_id)

                # parse message
                message_string = message_details["MessageString"]
                parsed_message = parse_message(message_string)

                if parsed_message is not None:
                    drone_id, prop, value = parsed_message
                    if not validate_message_prop_value(prop, value):

                          delete_message(message_id)
                    else:
                        command = generate_command(drone_id, prop, value)
                          try:
                            RES, NAMESPACE = find_res(drone_id)
                            if RES is not None and NAMESPACE is not None:
                                issue_command(RES, NAMESPACE, command)

                        except:
                            controllerlog = gen_ControllerLog(
                                "Drone with id %s not found, deleting message." % (str(drone_id)), "")

                            send_controllerlog(controllerlog)

                            delete_message(message_id)

                # delete message
                delete_message(message_id)
    except Exception as e:
        print(e)
```

### Parsing a Message
```python
""" Parsing a given message string.
    Messages will be in format 'Set Drone <DroneID> <Property> <Value>'.
    DroneID is the drone identifier assigned by the central controller.
    Property can be Direction, Speed or Status and values can be anything
    supported by that respective Property."""

    message_items = message_string.lower().split(" ")
    try:
        drone_id = message_items[message_items.index("drone") + 1]
        prop = message_items[message_items.index(drone_id) + 1]
        value = message_items[message_items.index(prop) + 1]

        return (drone_id, prop.title(), value.title())
    except Exception as e:
        print(e)

        return None
```

### Handling Anomalies
```python
    """Handling the anomalies in AnomalyCollection."""
    try:
        anomaly_collection = get_anomaly_collection()
        drone_collection = get_drone_collection()

        non_confirmed_anomalies, negative_anomalies = find_non_confirmed_and_negative_anomalies(
            anomaly_collection)

        # Handle non_confirmed_anomalies
        for anomaly in non_confirmed_anomalies:
            handle_anomaly(anomaly, drone_collection)

        # Delete Negative anomalies
        for anomaly in negative_anomalies:
            delete_anomaly(anomaly["AnomalyID"])
    except Exception as e:
        print(e)
```

The full implementation of the main loop is available at `flock_controller.mechanics.simulate`.
Full source code for the controller component is available [here](https://github.com/HTTP-APIs/hydra-flock-central-controller).


Drone Design
==============
Drones in this setup are pretty cool – they act as both **Hydra Servers and Hydra Clients** (we call 'em Hybrids!). This means they have some exposed endpoints where other Hydra Clients can send orders or ask for updates. But they also have their own Hydra Client capabilities, so they can send info and signals back to the Controller by calling its Hydra API. It's a two-way street!

## Main Features
- Drones can receive commands from the server at `/api/CommandCollection`.<br/>
Each command has a `State` object with properties like `Speed` and `Direction` or `Status`. Upon receiving a command the drone will act immediately unless there is some issue and it needs to override the command. <br/>
The drone deletes the command from it's `/api/CommandCollection` after successful execution of each command.
- Drones publish their current state with all other properties at `/api/Drone`.
- Drone publish the latest `Datastream` from its temperature sensors at `/api/Datastream`.
- Each drone has a unique id assigned by the controller at runtime.
- Drones cannot interact with other drones or issue commands to them directly, they need to do so via the central server.
- Drones will automatically decide when to charge and only, in that case, override the commands sent by the server only after sending a log of its status to the central server.
- Drones obey some basic rules ( For example - can’t hit each other)

## Drone Behavior
Drones are driven by a 15 second time loop after which the drones update their position, generate new sensor datastreams depending upon anomalies detected (if any).

### Main Loop design
```python
"""Main 15 second time loop for drone mechanics."""
    try:
        print("Retrieving the drone details")
        drone = get_drone()
        drone_identifier = drone["DroneID"]
        datastream = None

        # Commands will be executed in any state
        drone = handle_drone_commands(drone)

        if is_not_off(drone):

            ## Handle drone battery change
            drone = handle_drone_battery(drone)

            ## Handle drone general behaviour
            anomaly = get_anomaly()
            if anomaly is not None:
                if anomaly["Status"] == "Confirming" and drone["State"]["Status"] == "Active":
                    drone["State"]["Status"] = "Confirming"

            if is_confirming(drone):
                print("Drone handling anomaly")
                drone = handle_anomaly(drone)

            elif is_inactive(drone):
                print("Drone battery low, needs to charge")
                drone = handle_drone_low_battery(drone)

            elif is_active(drone):
                anomaly = gen_grid_anomaly(drone)
                if anomaly is not None:
                    print("New anomaly created")
                    send_anomaly(anomaly, drone_identifier)
                    datastream = gen_Datastream(gen_abnormal_sensor_data(
                    ), drone["State"]["Position"], drone_identifier)
                else:
                    datastream = gen_Datastream(gen_normal_sensor_data(
                    ), drone["State"]["Position"], drone_identifier)

            # Handle positions change
            drone = handle_drone_position(drone)

        # update the drone both locally and on the controller
        update_drone(drone)

        update_drone_at_controller(drone, drone_identifier)

        if datastream is not None:
            # Send datastream to central controller
            send_datastream(datastream)
            # Update datastream locally
            update_datastream(datastream)

    except Exception as e:
        print(e)

    finally:
        # call main() again in LOOP_TIME
        threading.Timer(LOOP_TIME, main).start()
```
The full implementation of the main loop is available at `flock_drone.mechanics.simulate`.

### Sample Drone Object
All the drone configurations are defined in a drone object.
```python
DRONE = {
    "@type": "Drone",
    "DroneID": "-1000",
    "name": "Drone 1",
    "model": "xyz",
    "MaxSpeed": "130",
    "Sensor": "Temperature",
    "State": {
        "@type": "State",
        "Speed": "100",
        "Position": "0,0",
        "Battery": "100",
        "Direction": "N",
        "Status": "Active",
    }
}
```
During runtime the drone mechanics modifies the `State` object to simulate the drone behavior.<br/>

### Speed
The speed of each drone can be controlled by user from the Simulation GUI.<br/>
**NOTE:-** `Speed <= MaxSpeed` of the drone.

### Direction and Position
- Drones will always move within the area of interest, if a drone reaches the boundary then it will change its direction.
- Each drone can move in one of the four directions East, West, North and South `[E, W, N, S]`

### Status
#### Drones use different `Status` values to handle different scenarios

- **Active** -
Active is the drone default drone status, in this state the drone is free to move around within the area of interest.
- **Inactive** -
The inactive mode is like power saving mode. Drone takes only 1/4 battery in this state and all the sensors are turned off. Drones use this state to return back to the central controller for charging.
- **Charging** -
Drones need to return to the central controller for charging. Drones change their status to `Charging` once they reach the central controller.
- **Confirming** -
When the drone is confirming any anomaly detected by some other drone. User can't change the drone direction in this state.
- **Off** - Drone is turned off.

### Battery
- **When `Battery > 20`** - Drones function normally when their `Battery > 20`
- **When `4 < Battery < 20`** - Drones enter power saving mode (`Inactive` state) and start moving toward the central controller for charging.
- **When `Battery < 4`** - If any drone fails to reach the central controller then it shuts down.

Full source code for the drone component is available [here](https://github.com/HTTP-APIs/hydra-flock-drone).
