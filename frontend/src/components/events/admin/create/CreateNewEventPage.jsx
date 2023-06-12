import React from 'react';
import { Redirect } from 'react-router-dom';
import api from '../../../../utils/axiosConfig';
import LoadingHolder from '../../../common/LoadingHolder';
import CreateTicketComponent from './CreateTicketComponent';
import ImageUploader from 'react-images-upload';

class CreateNewEventPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
      status: 0,
      error: "",
      name: "",
      date: "",
      shortDescription: "",
      description: "",
      maxIndividuals: "",
      bookingCloseTime: "",
      inviteOnly: false,
      disabled: false,
      ticketTypes: {},
      images: {},
      imageCaption: "",
      imagePosition: "gallery",
      disabledPositions: [],
      imageUpload: null,
      imageDisabled: false,
      temporaryImageSrcs: {},
      success: false
    };

    // Change this to your permission
    this.requiredPermission = "events.manage";
  }

  onInputChange = e => {
    this.setState({ [e.target.name]: (e.target.type === "checkbox" ? e.target.checked : e.target.value) })
  }

  // Load the data once the element is ready
  componentDidMount = async () => {
    let adminCheck;

    try {
      adminCheck = await api.get("/auth/verify");
    } catch (error) {
      this.setState({ status: error.response.status, error: "Unable to verify admin status" });
      return;
    }

    // Ensure they are an admin
    if(adminCheck.data.user.permissions) {
      if(adminCheck.data.user.permissions.length === 0) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }

      if(!adminCheck.data.user.permissions.includes(this.requiredPermission)) {
        this.setState({ status: 403, error: "You are not an admin" });
        return;
      }
    } else {
      this.setState({ status: 403, error: "You are not an admin" });
      return;
    }

    // Load any required data for the page here

    this.setState({ loaded: true }, this.createNewTicketType);
  }

  createNewTicketType = () => {
    // Blank data for a new ticket type
    const ticket = {
      name: "",
      description: "",
      maxOfType: "",
      minPeople: "",
      maxPeople: "",
      maxGuests: "",
      memberPrice: "",
      guestPrice: "",
      firstYearReleaseTime: "",
      secondYearReleaseTime: "",
      thirdYearReleaseTime: "",
      fourthYearReleaseTime: "",
      olderYearsCanOverride: true,
      customData: {}
    };

    // Get the next key, either 0 or one greater than the maximum
    const nextId = Object.keys(this.state.ticketTypes).length === 0 ? 0 : Math.max(...Object.keys(this.state.ticketTypes)) + 1;
    // Assign a blank ticket type and save to the state
    let newTickets = this.state.ticketTypes;
    newTickets[nextId] = ticket;

    this.setState({ ticketTypes: newTickets });
  }

  updateTicketType = (id, data) => {
    // Updates the data from a ticket type
    let newTickets = this.state.ticketTypes;
    newTickets[id] = data;
    this.setState({ ticketTypes: newTickets });
  }

  deleteTicketType = (id) => {
    // Remove a ticket type
    let newTickets = this.state.ticketTypes;
    delete newTickets[id];
    this.setState({ ticketTypes: newTickets });
  }

  onImageDrop = (image) => {
    if(image.length === 0) {
      alert("Invalid image type selected! It must be .jpg, .jpeg, .gif or .png");
      return;
    }
    // Set the current image when they select one
    this.setState({ imageUpload: image });
  }

  uploadImage = () => {
    this.setState({ imageDisabled: true });

    // Process the image data and check it is as expected
    const { imageCaption, imagePosition } = this.state;

    if(imageCaption === undefined || imageCaption === null || imageCaption.length === 0) {
      alert("You must set a caption for the image");
      this.setState({ imageDisabled: false });
      return;
    }

    if(imagePosition === undefined || imagePosition === null || imagePosition.length === 0) {
      alert("You must set a position for the image");
      this.setState({ imageDisabled: false });
      return;
    }

    // Checks the image was actually uploaded
    const image = this.state.imageUpload;

    if(image === undefined || image === null || image.length === 0) {
      alert("You must upload an image");
      this.setState({ imageDisabled: false });
      return;
    }

    // Get the next idea, either 0 or max + 1
    const nextId = Object.keys(this.state.images).length === 0 ? 0 : Math.max(...Object.keys(this.state.images)) + 1;

    // Store the image and its related data
    let newImages = this.state.images;
    newImages[nextId] = {
      image: image[0],
      caption: this.state.imageCaption,
      position: this.state.imagePosition
    };

    // We only allow one overview and one banner image
    let { disabledPositions } = this.state;

    if(this.state.imagePosition === "overview" || this.state.imagePosition === "banner") {
      disabledPositions.push(this.state.imagePosition);
    }

    // This is used to preview the image that was uploaded
    let temporaryImageSrcs = this.state.temporaryImageSrcs;
    temporaryImageSrcs[nextId] = null;

    // Use FileReader to generate the base64 data source
    const reader = new FileReader();

    // Problem is it is async and we don't want to wait for it load before rendering the page
    // So we just re-render once it is ready
    reader.onloadend = () => {
      let temporaryImageSrcs = this.state.temporaryImageSrcs;
      temporaryImageSrcs[nextId] = [reader.result];
      this.setState({ temporaryImageSrcs });
    }

    // Read the image
    reader.readAsDataURL(image[0]);

    // Reset the image upload form
    this.setState({ disabledPositions, temporaryImageSrcs, images: newImages, imageDisabled: false, imageUpload: null, imageCaption: "", imagePosition: "gallery" });
  }

  deleteImage = (id) => {
    // Deletes an already locally-uploaded image
    let newImages = this.state.images;
    let temporaryImageSrcs = this.state.temporaryImageSrcs;

    // We also have to re-enable uploading if it was for the overview icon or banner
    const { position } = newImages[id];
    let { disabledPositions } = this.state;

    // Filter it out of the disabled positions
    if(disabledPositions.includes(position)) {
      disabledPositions = disabledPositions.filter(x => x !== position);
    }

    // Remove the image, image data and base64 representation
    delete newImages[id];
    delete temporaryImageSrcs[id];

    this.setState({ disabledPositions, images: newImages, temporaryImageSrcs });
  }

  validateSubmission = () => {
    // Pretty basic but lots of checks to be done
    const { name, date, shortDescription, description, maxIndividuals, bookingCloseTime, inviteOnly, ticketTypes, images } = this.state;

    // Verify that each field has at least 1 item
    if(name === undefined || name === null || name.length === 0) {
      return [false, "You must set the event name"];
    }

    if(date === undefined || date === null || date.length === 0) {
      return [false, "You must set the event date"];
    }

    if(shortDescription === undefined || shortDescription === null || shortDescription.length === 0) {
      return [false, "You must set the event short description"];
    }

    if(description === undefined || description === null || description.length === 0) {
      return [false, "You must set the event description"];
    }

    if(maxIndividuals === undefined || maxIndividuals === null || maxIndividuals.length === 0) {
      return [false, "You must set the event maximum individuals"];
    }

    if(bookingCloseTime === undefined || bookingCloseTime === null || bookingCloseTime.length === 0) {
      return [false, "You must set the event booking close time"];
    }

    if(inviteOnly === undefined || inviteOnly === null) {
      return [false, "You must set whether the event is invite only"];
    }

    if(ticketTypes === undefined || ticketTypes === null || ticketTypes.length === 0) {
      return [false, "You must set at least one ticket type"];
    }

    if(images === undefined || images === null || images.length === 0) {
      return [false, "You must set at least 1 gallery image, an overview icon and a banner"];
    }

    // Now validate the ticket types

    const ticketTypeStringProps = [
      "name",
      "description",
      "firstYearReleaseTime",
      "secondYearReleaseTime",
      "thirdYearReleaseTime",
      "fourthYearReleaseTime"
    ];

    const ticketTypeIntegerProps = [
      "maxOfType",
      "maxPeople",
      "maxGuests",
      "minPeople"
    ];

    const ticketTypeFloatProps = [
      "memberPrice",
      "guestPrice"
    ];

    const ticketTypeBooleanProps = [
      "olderYearsCanOverride"
    ];

    // Loop over each ticket type
    for(const ticketTypeId in Object.keys(ticketTypes)) {
      const ticketType = ticketTypes[ticketTypeId];
      // Then over each property of each
      for(const property in ticketType) {
        // Perform checks depending on the expected data type
        if(ticketTypeStringProps.includes(property) || ticketTypeBooleanProps.includes(property)) {
          if(ticketType[property] === undefined || ticketType[property] === null || ticketType[property].length === 0) {
            return [false, `Missing ${property} in ticket type ${ticketType["name"]}`];
          }
        } else if (ticketTypeIntegerProps.includes(property)) {
          if(ticketType[property] === undefined || ticketType[property] === null || ticketType[property].length === 0) {
            return [false, `Missing ${property} in ticket type ${ticketType["name"]}`];
          }

          const asInt = parseInt(ticketType[property]);

          if(isNaN(asInt)) {
            return [false, `${property} must be a number`];
          }

          if(asInt < 0) {
            return [false, `Missing ${property} must be a non-negative value`];
          }
        } else if (ticketTypeFloatProps.includes(property)) {
          if(ticketType[property] === undefined || ticketType[property] === null || ticketType[property].length === 0) {
            return [false, `Missing ${property} in ticket type ${ticketType["name"]}`];
          }

          const asFloat = parseFloat(ticketType[property]);

          if(isNaN(asFloat)) {
            return [false, `${property} must be a number`];
          }

          if(asFloat < 0) {
            return [false, `Missing ${property} must be a non-negative value`];
          }
        } else if (property === "customData") {
          // Have to do quite a bit of checking of the custom data too
          const customData = ticketType[property];

          // If there isn't any custom data just skip it
          if(Object.keys(customData).length === 0) {
            continue;
          }

          // Loop each custom field
          for(const customFieldId in Object.keys(customData)) {
            const customField = customData[customFieldId];

            // Check the name and type are set
            if(customField.name.length === 0) {
              return [false, `Custom field name missing in ${ticketType.name}`];
            }

            if(customField.type.length === 0) {
              return [false, `Custom field type missing in ${ticketType.name}`];
            }

            // Check if there are any dropdown values
            if(Object.keys(customField.dropdownValues).length === 0) {
              // If there aren't and we are expecting some then it's an issue
              if(customField.type === "dropdown") {
                return [false, `Custom dropdown ${customField.name} in ${ticketType.name} is empty`];
              }

              // Not expecting any so continue
              continue;
            }

            // Loop over each value in the dropdown
            for(const customDropdownRowId in Object.keys(customField.dropdownValues)) {
              const customDropdownRow = customField.dropdownValues[customDropdownRowId];

              // Just check that each one has a value
              if(customDropdownRow.value.length === 0) {
                return [false, `Custom dropdown value is empty in ticket type ${ticketType.name}, custom field ${customField.name}`];
              }
            }
          }
        } else {
          return [false, `Unknown property ${property}`];
        }
      }
    }

    // Validate images
    const types = Object.keys(images).map(id => images[id].position);

    // Require at least one of each type
    if(!types.includes("overview") || !types.includes("banner") || !types.includes("gallery")) {
      return [false, "You must set at least 1 gallery image, an overview icon and a banner"];
    }

    // All good
    return [true, "Validated"];
  }

  packageSubmission = () => {
    // Package into a FormData object so we can submit it and use multer
    const { name, date, shortDescription, description, maxIndividuals, bookingCloseTime, inviteOnly, ticketTypes, images } = this.state;

    let packaged = { name, date: new Date(date), shortDescription, description, maxIndividuals, bookingCloseTime: new Date(bookingCloseTime), inviteOnly };
    // Map the object to an array instead
    let ticketTypeData = Object.keys(ticketTypes).map(id => ticketTypes[id]);

    // Separate out the data from the images
    let imageData = Object.keys(images).map(id => {
      return {
        caption: images[id].caption,
        position: images[id].position
      }
    });

    packaged.ticketTypes = ticketTypeData;
    packaged.imageData = imageData;

    const formData = new FormData();
    formData.append("packaged", JSON.stringify(packaged));

    // Put the images in, multer expects them all in one field
    Object.keys(images).forEach(id => {
      formData.append("images", images[id].image);
    });

    return formData;
  }

  createEvent = async () => {
    // Called when we want to submit it to the server
    this.setState({ disabled: true });
    const validated = this.validateSubmission();

    // Validation failed
    if(!validated[0]) {
      alert(validated[1]);
      this.setState({ disabled: false });
      return;
    }

    const formData = this.packageSubmission();

    // Send it to the server, set the content type so multer will intercept
    try {
      await api.post("/events/create", formData, {
        headers: { "content-type": "multipart/form-data" }
      });
    } catch (error) {
      // TODO: Handle the errors
      alert(error.response.data.error);
      this.setState({ disabled: false });
      return;
    }

    // All done so show the success message
    this.setState({ success: true });
  }

  render () {
    if(!this.state.loaded) {
      if(this.state.status !== 200 && this.state.status !== 0) {
        return (
         <Redirect to={`/errors/${this.state.status}`} />
        );
      }

      return (
        <LoadingHolder />
      );
    }

    if(this.state.success) {
      return (
        <div className="flex flex-col justify-start">
          <div className="container mx-auto text-center p-4">
            <h1 className="font-semibold text-5xl pb-4">Event Created</h1>
            <p>Your event has been created. It can now be viewed and edited from the admin overview.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col justify-start">
        <div className="container mx-auto text-center p-4">
          <h1 className="font-semibold text-5xl pb-4">Create New Event</h1>
          <p className="text-justify pb-2">Important: You must <a className="underline font-semibold" href="https://support.google.com/chrome/answer/95346?co=GENIE.Platform%3DDesktop&hl=en" rel="noopener noreferrer" target="_blank">use Google Chrome</a> or <a className="underline font-semibold" href="https://www.microsoft.com/en-us/edge" rel="noopener noreferrer" target="_blank">Microsoft Edge</a> otherwise the date and time selector will not show up. This is unfortunately caused by other browsers not supporting the feature (support is coming in the next major update to Safari on macOS). This page will not be easy to use on mobile devices due to the large amount of content that is needed.</p>
          <div className="flex flex-col items-center w-3/5 mx-auto">
            <div className="w-full">
              <h2 className="font-semibold text-5xl pb-2">Details</h2>
              <fieldset>
                <div className="pb-2 border-b-2">
                  <label htmlFor="name" className="flex flex-row justify-start text-xl font-semibold">Event Name</label>
                  <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.name.length} characters remaining)</span>
                  <input
                    type="text"
                    name="name"
                    value={this.state.name}
                    onChange={this.onInputChange}
                    className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                    disabled={this.state.disabled}
                    autoComplete=""
                    maxLength={255}
                  />
                </div>
                <div className="pt-2 pb-2 border-b-2">
                  <label htmlFor="date" className="flex flex-row justify-start text-xl font-semibold">Event Date and Time</label>
                  <span className="flex flex-row justify-start text-sm mb-2">This is the date and time of the actual event</span>
                  <input
                    type="datetime-local"
                    name="date"
                    value={this.state.date}
                    className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                    onChange={this.onInputChange}
                    disabled={this.state.disabled}
                    autoComplete=""
                  />
                </div>
                <div className="pt-2 pb-2 border-b-2">
                  <label htmlFor="inviteOnly" className="flex flex-row justify-start text-xl font-semibold">Invite Only?</label>
                  <span className="flex flex-row justify-start text-sm">Only admins will be able to create groups on behalf of others.</span>
                  <input
                    type="checkbox"
                    name="inviteOnly"
                    checked={this.state.inviteOnly}
                    className="p-2 h-6 w-6 align-middle rounded border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    onChange={this.onInputChange}
                    autoComplete=""
                    disabled={this.state.disabled}
                  />
                </div>
                <div className="pt-2 pb-2 border-b-2">
                  <label htmlFor="shortDescription" className="flex flex-row justify-start text-xl font-semibold">Short Description</label>
                  <span className="flex flex-row justify-start text-sm">This will be displayed on the overview of upcoming events</span>
                  <span className="flex flex-row justify-start text-sm mb-2">({500 - this.state.shortDescription.length} characters remaining)</span>
                  <textarea
                    name="shortDescription"
                    value={this.state.shortDescription}
                    onChange={this.onInputChange}
                    className="border w-full rounded my-2 h-48 py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                    disabled={this.state.disabled}
                    autoComplete=""
                    maxLength={500}
                  />
                </div>
                <div className="pt-2 pb-2 border-b-2">
                  <label htmlFor="description" className="flex flex-row justify-start text-xl font-semibold">Full Description</label>
                  <span className="flex flex-row justify-start text-sm">This will be displayed on the page specifically for this event</span>
                  <span className="flex flex-row justify-start text-sm mb-2">({30000 - this.state.description.length} characters remaining)</span>
                  <textarea
                    name="description"
                    value={this.state.description}
                    onChange={this.onInputChange}
                    className="border w-full rounded my-2 h-48 py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                    disabled={this.state.disabled}
                    autoComplete=""
                    maxLength={30000}
                  />
                </div>
                <div className="pt-2 pb-2 border-b-2">
                  <label htmlFor="maxIndividuals" className="flex flex-row justify-start text-xl font-semibold">Maximum Number of Individuals</label>
                  <span className="flex flex-row justify-start text-sm pb-2">The total number of people who can attend. You can also limit the amount of each ticket.</span>
                  <input
                    type="number"
                    name="maxIndividuals"
                    value={this.state.maxIndividuals}
                    className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                    onChange={this.onInputChange}
                    autoComplete=""
                    min={1}
                    step={1}
                    disabled={this.state.disabled}
                  />
                </div>
                <div className="pt-2 pb-2 border-b-2">
                  <label htmlFor="bookingCloseTime" className="flex flex-row justify-start text-xl font-semibold">Booking Closing Date and Time</label>
                  <span className="flex flex-row justify-start text-sm">This is the cutoff for booking on to the event.</span>
                  <span className="flex flex-row justify-start text-sm font-semibold pb-2">They will have 24 hours after this deadline to pay. Please account for this!</span>
                  <input
                    type="datetime-local"
                    name="bookingCloseTime"
                    value={this.state.bookingCloseTime}
                    className="shadow w-full border rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                    onChange={this.onInputChange}
                    autoComplete=""
                    disabled={this.state.disabled}
                  />
                </div>
              </fieldset>
            </div>
            <div className="w-full mt-6">
              <h2 className="font-semibold text-5xl pb-2">Images</h2>
              <div>
                <p>Upload Image</p>
                <div className="pb-2 border-b-2">
                  <label htmlFor="imageCaption" className="flex flex-row justify-start text-xl font-semibold">Image Caption</label>
                  <span className="flex flex-row justify-start text-sm mb-2">({255 - this.state.imageCaption.length} characters remaining)</span>
                  <input
                    type="text"
                    name="imageCaption"
                    value={this.state.imageCaption}
                    onChange={this.onInputChange}
                    className="border w-full rounded py-1 px-2 focus:outline-none focus:ring-2 disabled:opacity-50 focus:ring-gray-400"
                    disabled={this.state.disabled || this.state.imageDisabled}
                    autoComplete=""
                    maxLength={255}
                  />
                </div>
                <div className="pb-2 border-b-2">
                  <label htmlFor="imagePosition" className="flex flex-row justify-start text-xl font-semibold">Image Position</label>
                  <select
                    name="imagePosition"
                    className="md:w-auto w-full h-8 border border-gray-400 disabled:opacity-50"
                    onChange={this.onInputChange}
                    value={this.state.imagePosition}
                    disabled={this.state.disabled || this.state.imageDisabled}
                  >
                    <option value="overview" disabled={this.state.disabledPositions.includes("overview")}>Overview Icon</option>
                    <option value="banner" disabled={this.state.disabledPositions.includes("banner")}>Banner</option>
                    <option value="gallery">Gallery</option>
                  </select>
                </div>
                <div className="pb-2 border-b-2">
                  <label htmlFor="imagePosition" className="flex flex-row justify-start text-xl font-semibold">Image</label>
                  <ImageUploader
                    withIcon={false}
                    buttonText={"Choose Image"}
                    imgExtension={['.jpg', '.gif', '.png', '.jpeg']}
                    singleImage={true}
                    onChange={this.onImageDrop}
                    disabled={this.state.disabled || this.state.imageDisabled}
                  />
                  {
                    this.state.imageUpload === null ? (
                      <p>No image selected</p>
                    ) : (
                      <p>Image {this.state.imageUpload[0].name} selected</p>
                    )
                  }
                </div>
                <div className="pt-2 pb-2 border-b-2">
                  <button
                    className="px-4 py-2 rounded text-xl bg-green-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    disabled={this.state.disabled || this.state.imageDisabled}
                    onClick={this.uploadImage}
                  >Upload Image</button>
                </div>
              </div>
              <div>
                <h3>Uploaded Images</h3>
                {
                  Object.keys(this.state.images).length === 0 ? (
                    <p>No images uploaded</p>
                  ) : (
                    <table className="mx-auto border-2 text-left border-red-900 w-full">
                      <thead className="bg-red-900 text-white">
                        <tr>
                          <th className="p-2 font-semibold">Image</th>
                          <th className="p-2 font-semibold">Caption</th>
                          <th className="p-2 font-semibold">Position</th>
                          <th className="p-2 font-semibold">Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          Object.keys(this.state.images).map((id, i) => {
                            return (
                              <tr className="text-center border-b border-gray-400" key={id}>
                                <td className="p-2 border-r border-gray-400 flex flex-row justify-center">
                                  <img
                                    src={this.state.temporaryImageSrcs[id]}
                                    alt={this.state.images[id].caption}
                                    className="h-auto w-48"
                                  />
                                </td>
                                <td className="p-2 border-r border-gray-400">{this.state.images[id].caption}</td>
                                <td className="p-2 border-r border-gray-400">{this.state.images[id].position}</td>
                                <td className="p-2 border-r border-gray-400">
                                  <button
                                    className="px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                                    onClick={() => { this.deleteImage(id) }}
                                  >Remove</button>
                                </td>
                              </tr>
                            )
                          })
                        }
                      </tbody>
                    </table>
                  )
                }
              </div>
            </div>
            <div className="w-full mt-6">
              <h2 className="font-semibold text-5xl pb-2">Tickets</h2>
              <div className="flex flex-col">
                <div className="flex flex-row justify-start pb-4">
                  <button
                    className="px-4 py-1 rounded bg-green-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    disabled={this.state.disabled}
                    onClick={this.createNewTicketType}
                  >Add New Ticket Type</button>
                </div>
                {
                  Object.keys(this.state.ticketTypes).length === 0 ? (
                    <div className="flex flex-row justify-start">
                      <p className="font-semibold text-xl">No ticket types added.</p>
                    </div>
                  ) : (
                    Object.keys(this.state.ticketTypes).map((id) => (
                        <div className="flex flex-col border-2 border-black mt-2" key={id}>
                          <CreateTicketComponent
                            id={id}
                            passUp={this.updateTicketType}
                            defaults={{}}
                            disabled={this.state.disabled}
                          />
                          <div className="p-2 flex flex-row justify-start">
                            <button
                              className="px-4 py-1 rounded bg-red-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                              onClick={() => {
                                this.deleteTicketType(id)
                              }}
                              disabled={this.state.disabled}
                            >Delete Ticket Type</button>
                          </div>
                        </div>
                      )
                    )
                  )
                }
                {
                  Object.keys(this.state.ticketTypes).length === 0 ? null : (
                    <div className="flex flex-row justify-start py-4">
                      <button
                        className="px-4 py-1 rounded bg-green-900 text-white w-auto font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                        disabled={this.state.disabled}
                        onClick={this.createNewTicketType}
                      >Add New Ticket Type</button>
                    </div>
                  )
                }
              </div>
            </div>
            <div className="w-full">
              <button
                onClick={this.createEvent}
                className="px-4 py-1 text-2xl rounded bg-green-900 text-white w-full font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              >Create Event</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CreateNewEventPage;
