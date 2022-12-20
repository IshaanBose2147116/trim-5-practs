import boto3
from tkinter import Tk
from tkinter.filedialog import askopenfilename
import cv2
import os

BUCKET_NAME = "news-agency-imgs"

s3_client = boto3.client('s3')
s3_resource = boto3.resource('s3')

Tk().withdraw() # we don't want a full GUI, so keep the root window from appearing
filenamepath = askopenfilename() # show an "Open" dialog box and return the path to the selected filename
print(filenamepath)

filename = filenamepath.split("/")[-1] # file name
print(filename)

s3_resource.meta.client.upload_filename(
    filenamepath, BUCKET_NAME, "oimage/" + filename
) # uploading image to oimage folder

print("Uploaded to oimage!")

s3_resource.Object(BUCKET_NAME, "oimage/" + filename).download_filename(f"./.temp/{ filename }") # downloading image from oimage folder into .temp directory
print("Downloaded image!")

image = cv2.imread(filenamepath, 1)
thumbnail = cv2.resize(image, (300, 300), interpolation=cv2.INTER_CUBIC) # downsizing image to size 300x300

cv2.imwrite(f"./.temp/t_{ filename }", thumbnail) # writing to .temp file

s3_resource.meta.client.upload_filename(
    f"./.temp/t_{ filename }", BUCKET_NAME, f"timages/t_{filename}"
) # uploading to timages folder

print("Uploaded to timages")

dir = "./.temp"

for f in os.listdir(dir): # deleting all files in .temp folder
    os.remove(os.path.join(dir, f))

print("Deleted contents of .temp directory.")