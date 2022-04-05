# FCP Editor

Web-based editor for specifying Flight Control Procedures (FCPs) based on ESA's [SCOS-2000 standard](http://www.esa.int/Enabling_Support/Operations/Ground_Systems_Engineering/SCOS-2000). The project was started by duplicating the [fwprofile-editor](https://github.com/pnp-software/fwprofile-editor-pub).

FCPs are represented as UML activity diagrams which are created by dragging and dropping pre-defined elements on a canvas.
The editor is customized with a MySQL database or with a set MIB Tables which define the PUS telecommands and telemetry packets in SCOS-2000 format.
The editor offers auto-completion facilities which allow users to quickly reference telecommands and telemetry packets and their internal parameters (see screenshot below).

![TcAutoComp](https://user-images.githubusercontent.com/15838404/124101807-03c6ae00-da60-11eb-9a0c-51bd509d3c85.png)

FCP models can be shared (either in read-only or in read-write mode) with other users. They are serialized to a <code>json</code> format which can be exported and which users can process further (e.g. to generate a test sequence implementing an FCP).

Although the FCP Editor was developed with Flight Control Procedures in mind, it can be used to model any kind of control procedure for a PUS application. For instance, it could be used to define a test procedure or any other procedure consisting of sequences of telecommands and telemetry checks.

A public installation of the FCP Editor is available [here](https://www.pnp-software.com/fcp-editor/). It can be used to experiment and test the editor (its SCOS database was kindly provided by [R. Ottensamer](http://homepage.univie.ac.at/roland.ottensamer/) of the [Dept. of Astrophysics of the University of Vienna](https://ucris.univie.ac.at/portal/de/organisations/department-of-astrophysics(ea5888cb-4e25-46fa-9a04-9ecb91290ee7).html). 

The editor is an open and free software project. If you want to contribute, please [contact us](https://pnp-software.com/#contact-us).

## Licence
The FCP Editor is made available under the terms of the MIT licence (see above) but it also includes components made available under the Apache v2, MIT, CC, and GPL licences. See [here](https://github.com/pnp-software/fcp-editor/blob/master/DOCUMENTATION.licenses) for details.

## Ownership
The owner of the editor is [P&P Software GmbH](https://pnp-software.com/).
