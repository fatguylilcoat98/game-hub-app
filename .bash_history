git reset --soft HEAD~1
rm .git-credentials .gitconfig .bash_history
git add .
git commit -m "Cleaned up folders and updated Love Quiz sync"
stangman9898@penguin:~$ git add .
stangman9898@penguin:~$ git commit -m "Cleaned up folders and updated Love Quiz sync"
Author identity unknown
*** Please tell me who you are.
Run
to set your account's default identity.
Omit --global to set the identity only in this repository.

fatal: unable to auto-detect email address (got 'stangman9898@penguin.(none)')
stangman9898@penguin:~$ 
git config --global user.email "stangman9898@gmail.com"
git config --global user.name "fatguylilcoat98"
git config --global user.email "stangman9898@gmail.com"
git config --global user.name "fatguylilcoat98"
git commit -m "Cleaned up folders and updated Love Quiz sync"
git push origin main --force
