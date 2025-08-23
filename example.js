// Example JavaScript file to test the DAUNS extension

const appName = 'DAUNS Variable Detective';
let version = 1.0;
var isActivated = true;

function greetUser(name) {
  const greeting = 'Hello, ' + name + '!';
  let message = greeting + ' Welcome to ' + appName;
  var timestamp = new Date();

  return {
    greeting: greeting,
    message: message,
    timestamp: timestamp,
  };
}

const user = {
  name: 'Developer',
  role: 'Software Engineer',
};

let numbers = [1, 2, 3, 4, 5];
var settings = {
  theme: 'dark',
  language: 'en',
};

const result = greetUser(user.name);
console.log(result);
