import os
import random
import datetime

repo_path = os.getcwd()  # Get current directory (repo folder)
os.chdir(repo_path)

# Set the number of past days for commits
days = 365  # Change this to the number of days you want commits

for i in range(days):
    date = (datetime.datetime.now() - datetime.timedelta(days=i)).strftime("%Y-%m-%d")

    # Randomize the number of commits per day (to make it look natural)
    commits_today = random.randint(1, 5)
    for _ in range(commits_today):
        with open("activity_log.txt", "a") as file:
            file.write(f"Commit on {date}\n")

        os.system("git add activity_log.txt")
        os.system(f'git commit --date="{date} 12:00:00" -m "Commit on {date}"')

os.system("git push origin main")  # Change branch if necessary
