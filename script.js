'use strict';

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// BANKIST APP

// Data
const account1 = {
  owner: 'Jonas Schmedtmann',
  movements: [200, 455.23, -306.5, 25000, -642.21, -133.9, 79.97, 1300],
  interestRate: 1.2, // %
  pin: 1111,

  movementsDates: [
    '2019-11-18T21:31:17.178Z',
    '2019-12-23T07:42:02.383Z',
    '2020-01-28T09:15:04.904Z',
    '2020-04-01T10:17:24.185Z',
    '2020-05-08T14:11:59.604Z',
    '2020-07-26T17:01:17.194Z',
    '2020-07-28T23:36:17.929Z',
    '2020-08-01T10:51:36.790Z',
  ],
  currency: 'EUR',
  locale: 'pt-PT', // de-DE
};

const account2 = {
  owner: 'Jessica Davis',
  movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
  interestRate: 1.5,
  pin: 2222,

  movementsDates: [
    '2019-11-01T13:15:33.035Z',
    '2019-11-30T09:48:16.867Z',
    '2019-12-25T06:04:23.907Z',
    '2020-01-25T14:18:46.235Z',
    '2020-02-05T16:33:06.386Z',
    '2020-04-10T14:43:26.374Z',
    '2020-06-25T18:49:59.371Z',
    '2020-07-26T12:01:20.894Z',
  ],
  currency: 'USD',
  locale: 'en-US',
};

const accounts = [account1, account2];

// Elements
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');

const btnLogin = document.querySelector('.login__btn');
const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');

const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// LECTURES
/*
const currencies = new Map([
  ['USD', 'United States dollar'],
  ['EUR', 'Euro'],
  ['GBP', 'Pound sterling'],
]);

const movements = [200, 450, -400, 3000, -650, -130, 70, 1300];
*/

/////////////////////////////////////////////////

// Global variables
let currentAccount, timer;

// Functions
const formatNumber = (locale, currency, value) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
const formatDate = (locale, movDate) =>
  new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(new Date(movDate));

const transfer = function (sender, receiver) {
  sender.movements.push(Number(-inputTransferAmount.value));
  sender.movementsDates.push(new Date());
  receiver.movements.push(Number(inputTransferAmount.value));
  receiver.movementsDates.push(new Date());
  inputTransferTo.value = '';
  inputTransferAmount.value = '';
  inputTransferAmount.blur();
  updateUI(sender);
};

const loan = function (acc) {
  let maxLoans = 0;
  const highestDeposit = acc.movements.some(
    mov => mov > inputLoanAmount.value * 0.1
  );
  if (highestDeposit && inputLoanAmount.value > 0 && maxLoans <= 2) {
    acc.movements.push(Number(inputLoanAmount.value));
    acc.movementsDates.push(new Date());
    inputLoanAmount.value = '';
    inputLoanAmount.blur();
    updateUI(acc);
    maxLoans++;
  }
};

const logout = function () {
  containerApp.style.opacity = 0;
  labelWelcome.textContent = 'Log in to get started';
  currentAccount = null;
  clearInterval(timer);
  labelTimer.textContent = '00:00';
};
const countdownTimer = function () {
  let duration = 300;
  timer = setInterval(function () {
    const minutes = String(parseInt(duration / 60, 10)).padStart(2, '0');
    const seconds = String(duration % 60).padStart(2, '0');

    labelTimer.textContent = `${minutes}:${seconds}`;

    if (duration === 0) {
      clearInterval(timer);
      logout();
    }
    duration--;
  }, 1000);
};
const resetTimer = function (timer, resetFun) {
  clearInterval(timer);
  resetFun();
};

const displayMovements = function (acc, sorted = false) {
  containerMovements.innerHTML = '';
  const sortedArr = sorted
    ? acc.movements.slice().sort((a, b) => a - b)
    : acc.movements;
  sortedArr.forEach((mov, i) => {
    const operation = mov > 0 ? 'deposit' : 'withdrawal';
    const html = `<div class="movements__row">
          <div class="movements__type movements__type--${operation}">
            ${i + 1} ${operation}
          </div>
          <div class="movements__date">${formatDate(
            acc.locale,
            acc.movementsDates[i]
          )}</div>
          <div class="movements__value">${formatNumber(
            acc.locale,
            acc.currency,
            mov
          )}</div>
        </div>`;

    containerMovements.insertAdjacentHTML('afterbegin', html);
  });
};

const calcDisplayBalance = function (acc) {
  acc.balance = acc.movements.reduce((acc, curr) => acc + curr, 0);
  labelBalance.textContent = formatNumber(
    acc.locale,
    acc.currency,
    acc.balance
  );
};

const calcDisplaySummary = function (acc) {
  const income = Number(
    acc.movements.filter(mov => mov > 0).reduce((acc, curr) => acc + curr, 0)
  ).toFixed(1);

  const outcome = Math.abs(
    Number(
      acc.movements
        .filter(mov => mov < 0)
        .reduce((acc, curr) => acc + curr, 0)
        .toFixed(1)
    )
  );

  const interest = Number(
    acc.movements
      .filter(mov => mov > 0)
      .map(deposit => (deposit * acc.interestRate) / 100)
      .reduce((acc, curr) => acc + curr, 0)
  ).toFixed(2);

  labelSumIn.textContent = formatNumber(acc.locale, acc.currency, income);
  labelSumOut.textContent = formatNumber(acc.locale, acc.currency, outcome);
  labelSumInterest.textContent = formatNumber(
    acc.locale,
    acc.currency,
    interest
  );
};

const updateUI = function (acc) {
  calcDisplayBalance(acc);
  displayMovements(acc);
  calcDisplaySummary(acc);
  resetTimer(timer, countdownTimer);
};

// Creating logins
accounts.forEach(
  acc =>
    (acc.login = acc.owner
      .toLowerCase()
      .split(' ')
      .map(el => el[0])
      .join(''))
);

// Event Listeners
btnLogin.addEventListener('click', function (e) {
  e.preventDefault();
  currentAccount = accounts.find(
    accName => accName.login === inputLoginUsername.value
  );
  if (currentAccount?.login) {
    if (Number(inputLoginPin.value) === currentAccount?.pin) {
      containerApp.style.opacity = 100;
      labelWelcome.textContent = `Welcome back, ${
        currentAccount.owner.split(' ')[0]
      }!`;
      inputLoginPin.value = '';
      inputLoginUsername.value = '';
      inputLoginPin.blur();
    }
    let sorted = false;
    btnSort.addEventListener('click', function () {
      sorted = !sorted;
      displayMovements(currentAccount, sorted);
      resetTimer(timer, countdownTimer);
    });
    updateUI(currentAccount);
  }
});

btnTransfer.addEventListener('click', function (e) {
  e.preventDefault();
  const transferToAccount = accounts.find(
    acc => acc.login === inputTransferTo.value
  );

  if (
    transferToAccount &&
    transferToAccount !== currentAccount &&
    Number(inputTransferAmount.value) > 0 &&
    Number(inputTransferAmount.value) <= currentAccount.balance
  ) {
    transfer(currentAccount, transferToAccount);
  }
});
btnLoan.addEventListener('click', function (e) {
  e.preventDefault();
  loan(currentAccount);
});
btnClose.addEventListener('click', function (e) {
  e.preventDefault();
  if (
    inputCloseUsername.value === currentAccount.login &&
    Number(inputClosePin.value) === currentAccount.pin
  )
    delete currentAccount.login, currentAccount.pin;
  logout(currentAccount);
  inputCloseUsername.blur();
  inputClosePin.blur();
});
