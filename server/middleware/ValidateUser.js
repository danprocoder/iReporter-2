import HelperUtils from '../utils/HelperUtils';
import pool from '../models/dbconnection';

/**
 * @class ValidateUser
 * @description Intercepts and validates a given request for user endpoints
 * @exports ValidateUser
 */
class ValidateUser {
  /**
   * @method validateProfile
   * @description Validates profile details of the user upon registration
   * @param {object} req - The Request Object
   * @param {object} res - The Response Object
   * @returns {object} JSON API Response
   */
  static validateProfileDetails(req, res, next) {
    const validate = HelperUtils.validate();
    const {
      firstname, lastname, othername, phonenumber, username,
    } = req.body;
    let error = '';

    if (!validate.name.test(firstname)) {
      error = 'You need to include a valid first name';
    } else if (!validate.name.test(lastname)) {
      error = 'You need to include a valid last name';
    } else if (!validate.phonenumber.test(phonenumber)) {
      error = 'You need to include a valid phone number';
    } else if (!validate.username.test(username)) {
      error = 'You need to include a valid username';
    } else if (othername && !validate.name.test(othername)) {
      error = 'The other name you provided is invalid';
    }

    if (error) {
      return res.status(400).json({ status: 400, error });
    }

    return next();
  }

  /**
   * @method validateLoginDetails
   * @description Validates login details (email and password) of a user upon login/registration
   * @param {object} req - The Request Object
   * @param {object} res - The Response Object
   * @returns {object} JSON API Response
   */
  static validateLoginDetails(req, res, next) {
    const validate = HelperUtils.validate();
    const { email, password } = req.body;
    const path = req.url.split('/')[2];
    let error;
    let status;

    const query = 'SELECT email, password FROM users WHERE email = $1';

    if (!validate.email.test(email)) {
      error = 'The email you provided is invalid';
    } else if (!password) {
      error = 'You need to provide a password';
    } else if (password.length < 8) {
      error = 'Password length must be 8 characters and above';
    }

    if (error) {
      status = 400;
      return res.status(status).json({ status, error });
    }

    if (path === 'login') {
      return pool.query(query, [email], (err, dbRes) => {
        if (dbRes.rowCount < 1) {
          error = 'Sorry, the email account you provided does not exist';
          return res.status(404).json({ status: 404, error });
        }
        req.user = dbRes.rows;
        return next();
      });
    }

    return next();
  }

  static validateExistingUser(req, res, next) {
    const { email, username, phonenumber } = req.body;

    const query = `SELECT email, 
                    username, 
                    phonenumber 
                    FROM 
                    users 
                    WHERE email = $1 
                    OR username = $2 
                    OR phonenumber = $3`;

    pool.query(query, [email, username, phonenumber], (err, dbRes) => {
      if (dbRes.rowCount >= 1) {
        const rows = dbRes.rows[0];
        const errorMsg = Object.keys(rows).join(', ');
        return res.status(409).json({
          status: 409,
          error: `A user with the given ${errorMsg} already exists`,
        });
      }
      return next();
    });
  }
}

export default ValidateUser;
