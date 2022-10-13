/* eslint-disable @typescript-eslint/no-explicit-any */
import getNewCompletedKatas from "./getUserCompletedList"
import getKataDetails from "./getKataDetails"
import axios from "axios"
import axiosThrottle from "axios-request-throttle"

// Axios request throttling to prevent too many requests error from codewars.com on large imports
// ?Not sure this has any effect here (or now) because all axios calls have been separated
axiosThrottle.use(axios, { requestsPerSecond: 1 })

//TODO - This flow is INCOMPLETE - check this and ensure flow works
//TODO - Filename is only generated after it's required in processCodeBlockStrings
//TODO - Need to create it earlier or adjust something to accommodate the required filename param in the above block
// Main app
const filteredCompletedKatas = getNewCompletedKatas()
const kataDetails = getKataDetails(filteredCompletedKatas)
getKataDetails(kataDetails)
console.log("Processing COMPLETE!  Check output path to confirm everything has completed as expected.")
process.exitCode = 0
