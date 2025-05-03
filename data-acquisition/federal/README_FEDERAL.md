### FEDERAL READ ME

The Federal Government has consistent ethics disclosures.

They are not released in PDF form, and instead are shown on a searchable portal.

The disclosures have an English and French version and 99% of the time there is parity, with only 2 exceptions ever found.

The process of gathering it is... complicated.

For one, the feds may update it at any time without warning - and remove it the moment parliament is dissolved or an MP resigns or is otherwise removed from office.

Secondly, because there are over 300+ MPs and we have to automate the typing of their names, and loading their disclosure pages, Selenium has a tendency to crash after navigating 100 pages or so and it takes about an hour to run all MPs through the system.

Thirdly, because the portal contains ethics disclosures and data for ALL FEDERAL EMPLOYEES not just MPs, we have
to do some clever filtering to ensure we don't accidentally get the wrong document for MPs who have common names.

The data quality and formatting is quite consistent, but there were a few small exceptions.

Searching "Firstname Lastname Member of Parliament" returns the correct document as the first result in 99% of cases, with 1 exception found - if this changes for the new parliament it might profoundly mess with our ability to automate this.

Overall Data Score: Okay