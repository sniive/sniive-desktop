import time
import sys
from pynput import mouse, keyboard
from threading import Lock

mutex: Lock = Lock()

def output_json(json_string: str):
    mutex.acquire()
    sys.stdout.write(json_string)
    sys.stdout.write("\n")
    sys.stdout.flush()
    mutex.release()

def on_press(key):
    try:
        json_string = f"""{{"action":"pressed_key", "key":"{key.char}", "time":{time.time()}}}"""
    except AttributeError:
        json_string = f"""{{"action":"pressed_key", "key":"{str(key)}", "time":{time.time()}}}"""
    finally:
      output_json(json_string)


def on_release(key):
    try:
        json_string = f"""{{"action":"released_key", "key":"{key.char}", "time":{time.time()}}}"""
    except AttributeError:
        json_string = f"""{{"action":"released_key", "key":"{str(key)}", "time":{time.time()}}}"""
    finally:
      output_json(json_string)


def on_click(x, y, button, pressed):
    json_string = f"""{{"action":"{'clicked' if pressed else 'unclicked'}", "button":"{str(button)}", "x":{x}, "y":{y}, "time":{time.time()}}}"""
    output_json(json_string)


def on_scroll(x, y, dx, dy):
    json_string = f"""{{"action":"scrolled", "vertical_direction":{dy}, "horizontal_direction":{dx}, "x":{x}, "y":{y}, "time":{time.time()}}}"""
    output_json(json_string)

    


def start_recording():
    keyboard_listener = keyboard.Listener(
        on_press=on_press,
        on_release=on_release)

    mouse_listener = mouse.Listener(
            on_click=on_click,
            on_scroll=on_scroll)
    

    keyboard_listener.start()
    mouse_listener.start()
    keyboard_listener.join()
    mouse_listener.join()


if __name__ == "__main__":
    start_recording()
    