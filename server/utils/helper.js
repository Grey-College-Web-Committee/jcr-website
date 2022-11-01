const makeDisplayName = (firstNames, surname) => {
    const upperCaseFirstName = firstNames.split(",")[0];
    const firstName = upperCaseFirstName.substring(0, 1) + upperCaseFirstName.substring(1).toLowerCase();
  
    const upperCaseLastName = surname;
    const specialCaseList = ["MC", "MAC"];
    const foundSpecialCase = specialCaseList.filter(c => upperCaseLastName.startsWith(c));
  
    let lastName = upperCaseLastName.substring(0, 1) + upperCaseLastName.substring(1).toLowerCase();
  
    // Fix special cases like McDonald appearing as Mcdonald
    if(foundSpecialCase.length !== 0) {
      const c = foundSpecialCase[0].substring(0, 1) + foundSpecialCase[0].substring(1).toLowerCase();
      lastName = upperCaseLastName.substring(c.length);
      lastName = c + lastName.substring(0, 1) + lastName.substring(1).toLowerCase();
    }
  
    // Fix hyphens
    if(lastName.includes("-")) {
      let capNext = false;
      let newLastName = [];
  
      for(const i in lastName) {
        if(capNext) {
          newLastName.push(lastName[i].toUpperCase());
          capNext = false;
          continue;
        }
  
        newLastName.push(lastName[i]);
        capNext = lastName[i] === "-";
      }
  
      lastName = newLastName.join("")
    }
  
    // Fix apostrophes
    if(lastName.includes("'")) {
      let capNext = false;
      let newLastName = [];
  
      for(const i in lastName) {
        if(capNext) {
          newLastName.push(lastName[i].toUpperCase());
          capNext = false;
          continue;
        }
  
        newLastName.push(lastName[i]);
        capNext = lastName[i] === "'";
      }
  
      lastName = newLastName.join("")
    }
  
    return `${firstName} ${lastName}`;
}

module.exports = { makeDisplayName };