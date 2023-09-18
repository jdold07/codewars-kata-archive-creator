# **Codewars Kata Archiver**

### _For maintaining & organising your completed [Codewars.com](https://www.codewars.com) Kata solutions_

## <br>

## **What it does...**

Designed to to access Kata information and a user's completed Kata information provided through the [Codewars.com](https://www.codewars.com) API. Then, armed with that, produce a detailed Kata description as a markdown file and save this to disk in an organised file structure.

Well that was the initial intent, however, it evolved to also collect the user's completed solutions, format them and save them to disk as a language file. And then, further extended to also fetch the test code for the kata and format & save that to disk as a test file. Configured correctly, this enables code solutions to be run against tests in your local environment.

<br>

## **Why do it...**

I was trying to organise an absolute mess of completed Kata files on my own system that have accumulated over the course of my time on [Codewars.com](https://www.codewars.com). I almost always prefer to code the solutions in my own familiar IDE environment in favour of the online editor. Over time this has amounted to an unordered mess of saved files that I always had intentions of getting sorted.

In another project, I will be organising all my completed solutions into a Github repository in order to:

1. Organise all the mess in a consistent and organised format.
2. Maintain a kind-of place of reference for me (and now others) to refer to.
3. Become more proficient with git and making it part of the normal flow.
4. Finally getting wrapping my head around unit testing by creating tests for each completed Kata.
5. And now, with this app, writing an app to automate some of the repetitive work.

<br>

## **The snowball effect...**

So this kind of evolved from just generating the description as a markdown file for me to more of a _"complete"_ import solution.

Once I got the markdown file thing sorted, I looked at the files of completed Kata on my system and thought ... _"this is too much, I'll never sort this out"_. At the time of making this, I think I had completed around 750 Katas or thereabouts. I also knew, that a large chunk of those weren't saved at all or were sitting (unlabelled) in several sort of scratch pad files.

So, I decided to import my solutions by grabbing them all from [Codewars.com](https://www.codewars.com). Unfortunately, the API doesn't provide for this. So this information needed to be scrapped from my profile page. I coded out a basic web scrape, format and file write to get all my solutions in order and that was fine...

Now, determined to make testing a part of this dance, I decided to go ahead and scrape the tests for all the Kata I had completed as well. This took a fairly similar approach to gathering my code solutions and was therefore not a big stretch from what I had done for the code solutions.

Now all that was done as a big initial import, I needed a way to keep it up-to-date. So I re-wrote the whole thing to filter existing from new and allow for the updating of one, many or additional languages of existing Katas.

<br>

## **Where am I up to?**

So, it's _functional_ 🥳 and I think it now does most everything I need it to do. However, there are still several tweaks I know I'd like to make. The main things I'm aware of are:

1. ✅ ~~Currently, when grabbing solutions from the profile page, it only reads the first page of the infinite scroll. I just haven't needed anything more than this, so I haven't done it. As I update it frequently, I don't need solutions beyond the first page, as the list is sorted most recent to oldest. For a bulk import, this would not be sufficient, and you would want to be able to collect all solutions.~~ 🥳 This has now been added! Including a config option flag to get all or only the first page.
2. ✅ ~~While looping what needs updating, it currently calls ~~to make the root kata folder and~~ the markdown description for each completed language of a given Kata. I want to modify this to remove the unnecessary rewrite.~~ 🥳 This has been completed now... _I think_.
3. ✅ ~~Finish commenting all the code to it's explicit as to what everything is doing (preferably before I have to work it out again 😫)~~ 🥳 This has been completed now... _I think_.
4. ✅ ~~Create all the types properly to eliminate the tons of any's that I'm currently using 😜~~ 🥳 This has been completed now... _I think_.
5. Currently only capable of handling languages I've completed Katas in on [Codewars.com](https://www.codewars.com). I would like to extend the app to handle additional languages.
6. Add to this readme or other similar documentation in regard to installation, configuration and running the app.
7. Currently the app uses the session ID cookie to access the user profile and tests for Kata the user has completed. This is a bit of pain, as it requires grabbing that from Dev Tools to add to the config. I'd like to try and find a more elegant solution to handling authentication.
8. I'm sure there are other things, but the escape me right now

But, for the time being, it works! So I'll see where it goes from here.

<br>

## **Thanks to the creators & maintainers of the dependency modules I used to make this app work!**

An little extra credit to [IonicaBizau](https://github.com/IonicaBizau/json2md). Although he/she/they would't know it, while fumbling with the idea of this whole thing, it was stumbling onto this library and going through its repo that finally gave me the push to just have a go and pursue actually creating this little project instead of leaving it as just an idea.
