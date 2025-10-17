===============================
PYTHON QUICK REMINDER SHEET
===============================

# --- VARIABLES & BASICS ---
x = 10           # Integer
y = 3.14         # Float
name = "John"    # String
is_active = True # Boolean
z = None         # NoneType

# Multiple assignment & swap
a, b, c = 1, 2, 3
a, b = b, a

# --- LISTS ---
lst = [1, 2, 3]
lst.append(4)        # Push at end
lst.insert(1, 10)    # Insert at index
lst.remove(3)        # Remove by value
val = lst.pop()      # Pop last
lst.sort()           # Sort in place
lst.reverse()        # Reverse
lst2 = lst[::-1]     # Reverse copy
for item in lst:
    print(item)

# --- TUPLES ---
tup = (1, 2, 3)
a, b, c = tup        # Unpacking

# --- SETS ---
s = {1, 2, 3}
s.add(4)
s.remove(2)          # Error if not found
s.discard(5)         # Safe remove
s2 = {3, 4, 5}
union = s | s2
inter = s & s2
diff  = s - s2

# --- DICTIONARIES ---
d = {"a": 1, "b": 2}
d["c"] = 3
val = d.get("a")     # Safe get
for k, v in d.items():
    print(k, v)

# --- STACK (LIST) ---
stack = []
stack.append(1)      # Push
stack.pop()          # Pop

# --- QUEUE ---
from collections import deque
queue = deque()
queue.append(1)      # Enqueue
queue.popleft()      # Dequeue

# --- HEAP / PRIORITY QUEUE ---
import heapq
heap = []
heapq.heappush(heap, 3)
heapq.heappush(heap, 1)
heapq.heappop(heap)  # Smallest out

# --- LOOPS & CONDITIONS ---
for i in range(5):
    print(i)
while condition:
    break
if x > 0:
    pass
elif x == 0:
    pass
else:
    pass

# --- FUNCTIONS ---
def func(a, b=10):
    return a + b

lambda_func = lambda x: x**2

# --- COMPREHENSIONS ---
lst = [x**2 for x in range(5) if x % 2 == 0]
set_comp = {x for x in range(5)}
dict_comp = {x: x**2 for x in range(5)}

# --- ENUMERATION ---
for i, val in enumerate(["a", "b"]):
    print(i, val)

# --- ZIP ---
names = ["a", "b"]
scores = [90, 80]
for n, s in zip(names, scores):
    print(n, s)

# --- CLASSES ---
class MyClass:
    # Class attribute (shared by all instances)
    class_var = "shared"

    def __init__(self, value):
        self.value = value  # Instance attribute

    def method(self):
        return f"Value is {self.value}"

    @classmethod
    def class_method(cls):
        return cls.class_var

    @staticmethod
    def static_method():
        return "Static call"

# Using the class
obj = MyClass(42)
print(obj.method())          # Instance method
print(MyClass.class_method())# Class method
print(MyClass.static_method())# Static method
