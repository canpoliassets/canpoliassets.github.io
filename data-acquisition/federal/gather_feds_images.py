import requests
import html

# IMAGE GATHERING
base_url = 'https://www.ourcommons.ca/'
f = open('parliament.html') # Save a copy to your local and run it against that.
for line in f.readlines():
    if '<img' in line:
        img_src = line.split(' src="/')[1].split(' loading="lazy"')[0]
        full_img_url = (base_url+img_src).rstrip('"')
        full_img_url = html.unescape(full_img_url)

        try:
            # print(full_img_url)
            response = requests.get(full_img_url, stream=True)
            response.raise_for_status()  # Check if the request was successful

            # Extract the image name (use the last part of the URL as the file name)
            image_name = line.split('/')[-1].split('"')[0]
            image_name = html.unescape(image_name)
            # print(image_name)
            # Save the image content to a file
            with open(f'images/{image_name}', 'wb') as file:
                for chunk in response.iter_content(1024):
                    file.write(chunk)
                print(f"Image downloaded: {image_name}")

        except Exception as e:
            print(f"Error downloading image: {e}")

        finally:
            print("Done.")
