import boto3
from tkinter import Tk
from tkinter.filedialog import askopenfilename

BUCKET_NAME = "practice-22112022"

s3_client = boto3.client('s3')
s3_resource = boto3.resource('s3')

all_objects = s3_client.list_objects(Bucket=BUCKET_NAME, Delimiter="/")
folders = []


for i in all_objects["CommonPrefixes"]:
    folders.append(i["Prefix"])

print("Choose folder:")
for i in range(len(folders)):
    print(f"{ i + 1 }. { folders[i] }")

choice = 0
while True:
    choice = int(input("Choose: "))
    if choice < 1 or choice > len(folders):
        print("Invalid choice!")
    else:
        break

folder = folders[choice - 1]

Tk().withdraw() # we don't want a full GUI, so keep the root window from appearing
filepath = askopenfilename()
print(filepath)

filename = filepath.split("/")[-1]

# response = s3_client.upload_file(filepath, BUCKET_NAME, f"{ folder }{ filename }")
s3_resource.meta.client.upload_file(
    filepath, BUCKET_NAME, folder + filename
) # uploading image to oimage folder
print("Uploaded")