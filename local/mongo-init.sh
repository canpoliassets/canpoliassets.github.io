set -e

# The following is javascript code. We put this in a .sh file to access the env vars.
# The code creates the collections and inserts some example data.
mongosh <<EOF
use $MONGO_INITDB_DATABASE

db.createCollection("mps");
db.createCollection("sheet_data");
db.createCollection("disclosures");

const mps = [{
  name: "John Doe",
  constituency: "Example Constituency",
  party: "Example Party",
  province: "Example Province",
  image_name: "john_doe.jpg"
}];

const disclosures = [{
  name: "John Doe",
  category: "Assets",
  content: "Example content from ethics portal"
}];

const sheetData = [{
  name: "John Doe",
  homeowner: "Yes",
  landlord: "No",
  investor: "Yes"
}];

db.mps.insertMany(mps);
db.disclosures.insertMany(disclosures);
db.sheet_data.insertMany(sheetData);

EOF